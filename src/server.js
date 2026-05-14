#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, extname, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { detectLang, t, getAllStrings, getLang } from './i18n.js';

// ── Language detection ──
const projectDir = process.argv[2] || process.cwd();
const langArg = process.argv.find(a => a.startsWith('--lang='));
const lang = langArg ? langArg.split('=')[1] : null;
detectLang(lang);

// ── Error pattern regex ──
// Supports: PHP, JS/TS, Python, Go, Ruby, Java, Rust, CSS/SCSS, HTML
const ERROR_PATTERNS = [
  // PHP: in /path/file.php on line 42
  /(?:in|at)\s+(\/[\w./\-]+\.php)\s+on\s+line\s+(\d+)/gi,
  // JS/TS/JSX/TSX/Vue: at func (file.js:42:10) or file.js:42:10
  /(?:at\s+\S+\s+\(|at\s+)([\w./\-]+\.(?:js|ts|jsx|tsx|vue|mjs|cjs)):(\d+)(?::\d+)?\)?/gi,
  // Standalone file:line (Go, Rust, etc.)
  /(?:^|\s|["'])([\w./\\\-]+\.(?:js|ts|jsx|tsx|vue|go|rs|py|rb|java|php|css|scss|html)):(\d+)(?::\d+)?(?:\s|["']|$)/gim,
  // Python: File "file.py", line 42
  /File\s+"([^"]+\.py)",\s+line\s+(\d+)/gi,
  // Java: at com.example.File.java:42
  /at\s+[\w.]+\.([\w]+\.java):(\d+)/gi,
];

function parseErrorForFiles(errorMessage) {
  const files = new Map();
  for (const pattern of ERROR_PATTERNS) {
    let match;
    while ((match = pattern.exec(errorMessage)) !== null) {
      const filePath = match[1];
      const line = parseInt(match[2], 10);
      if (filePath && !isNaN(line)) {
        const existing = files.get(filePath);
        if (!existing || Math.abs(line - existing) < Math.abs(line - existing)) {
          files.set(filePath, line);
        }
      }
    }
  }
  return files;
}

// ── Code reader ──
function readCodeAtLine(filePath, errorLine, contextLines, rootDir) {
  const fullPath = resolve(rootDir, filePath);
  if (!existsSync(fullPath)) return null;

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const totalLines = lines.length;

    const start = Math.max(0, errorLine - 1 - contextLines);
    const end = Math.min(totalLines, errorLine + contextLines);

    const displayLines = [];
    for (let i = start; i < end; i++) {
      const lineNum = i + 1;
      const marker = lineNum === errorLine ? ` ${t('code_error_line')}` : '';
      displayLines.push(`${String(lineNum).padStart(4)}│ ${lines[i]}${marker}`);
    }

    return {
      filePath: resolve(rootDir, filePath),
      relativePath: filePath,
      totalLines,
      errorLine,
      startLine: start + 1,
      endLine: end,
      content: displayLines.join('\n'),
    };
  } catch {
    return null;
  }
}

// ── Git context collector ──
function collectGitContext(rootDir) {
  const result = {
    recentCommits: [],
    unstagedChanges: '',
    stagedChanges: '',
    latestDiff: '',
    hasGit: false,
  };

  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: rootDir, stdio: 'pipe' });
    result.hasGit = true;
  } catch {
    return result;
  }

  // Recent 8 commits
  try {
    const log = execSync(
      'git log --oneline -8 --format="%h %s %ar"',
      { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' }
    ).trim();
    if (log) {
      result.recentCommits = log.split('\n').filter(Boolean);
    }
  } catch { /* ignore */ }

  // Unstaged changes
  try {
    result.unstagedChanges = execSync(
      'git diff --stat',
      { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' }
    ).trim();
  } catch { /* ignore */ }

  // Staged changes
  try {
    result.stagedChanges = execSync(
      'git diff --cached --stat',
      { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' }
    ).trim();
  } catch { /* ignore */ }

  // Latest commit diff
  try {
    result.latestDiff = execSync(
      'git diff HEAD~1 HEAD 2>/dev/null || git diff HEAD',
      { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8', maxBuffer: 1024 * 512 }
    ).trim();
  } catch { /* ignore */ }

  return result;
}

// ── Project tree scanner ──
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build',
  '.next', '.nuxt', 'vendor', '__pycache__', '.idea', '.vscode',
  'coverage', '.cache', '.temp', '.tmp',
]);

function getProjectTree(rootDir, maxDepth = 4) {
  const lines = [];

  function walk(dir, prefix, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true })
        .filter(e => !IGNORE_DIRS.has(e.name) && !e.name.startsWith('.'))
        .sort((a, b) => {
          if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    } catch { return; }

    entries.forEach((entry, i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        lines.push(`${prefix}${connector}${entry.name}/`);
        walk(fullPath, prefix + childPrefix, depth + 1);
      } else {
        lines.push(`${prefix}${connector}${entry.name}`);
      }
    });
  }

  walk(rootDir, '', 0);
  return lines.join('\n');
}

// ── Search in project ──
function searchInProject(keyword, rootDir, fileType) {
  const results = [];
  const maxResults = 50;

  function walk(dir) {
    if (results.length >= maxResults) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch { return; }

    for (const entry of entries) {
      if (results.length >= maxResults) return;
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        if (fileType && extname(entry.name).slice(1) !== fileType) continue;
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          const matches = [];
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(keyword.toLowerCase())) {
              matches.push({ line: idx + 1, content: line.trim() });
            }
          });
          if (matches.length > 0) {
            results.push({
              file: relative(rootDir, fullPath),
              matches: matches.slice(0, 10),
              totalMatches: matches.length,
            });
          }
        } catch { /* skip binary files etc */ }
      }
    }
  }

  walk(rootDir);
  return results;
}

// ── Missing context detection ──
function detectMissingContext(errorMessage, foundFiles, gitContext) {
  const missing = [];

  if (errorMessage.length < 50 && !errorMessage.includes('\n')) {
    missing.push({ priority: 'high', key: 'missing_short_error', hint: 'missing_file_hint' });
  }

  if (foundFiles.length === 0) {
    missing.push({ priority: 'high', key: 'missing_no_files', hint: 'missing_file_confirm' });
  }

  if (foundFiles.length > 0) {
    const allShort = foundFiles.every(f => f.totalLines < 20);
    if (allShort) {
      missing.push({ priority: 'medium', key: 'missing_short_files' });
    }
  }

  if (!gitContext.hasGit) {
    missing.push({ priority: 'low', key: 'missing_no_git' });
  }

  const expectWords = ['expect', '期望', '应该', 'expected', 'should', 'want', '想要'];
  const hasExpect = expectWords.some(w => errorMessage.toLowerCase().includes(w));
  if (!hasExpect) {
    missing.push({ priority: 'low', key: 'missing_no_expect' });
  }

  const envWords = ['command not found', 'not recognized', 'ENOENT', 'MODULE_NOT_FOUND'];
  const hasEnv = envWords.some(w => errorMessage.includes(w));
  if (hasEnv) {
    missing.push({ priority: 'medium', key: 'missing_env_error' });
  }

  return missing;
}

// ── Token estimation ──
function estimateTokens(text) {
  let count = 0;
  for (const char of text) {
    if (/[一-鿿]/.test(char)) {
      count += 1.5;
    } else {
      count += 0.25;
    }
  }
  return Math.round(count);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

// ── Report builder ──
function buildReport(errorMessage, codeResults, gitContext, projectTree, missing, startTime, rootDir) {
  const s = getAllStrings();
  const parts = [];

  // Title
  parts.push(s.report_title);
  parts.push('');

  // Error
  parts.push(s.report_error_section);
  parts.push('```');
  parts.push(errorMessage);
  parts.push('```');
  parts.push('');

  // Code
  if (codeResults.length > 0) {
    parts.push(s.report_code_section);
    for (const code of codeResults) {
      const header = `### ${code.relativePath} (${t('code_total_lines', { count: code.totalLines })}) ← ${t('code_show_range', { start: code.startLine, end: code.endLine })}`;
      parts.push(header);
      parts.push('```');
      parts.push(code.content);
      parts.push('```');
      parts.push('');
    }
  }

  // Git
  parts.push(s.report_git_section);
  if (gitContext.hasGit) {
    if (gitContext.recentCommits.length > 0) {
      parts.push(s.git_commits);
      parts.push('```');
      parts.push(gitContext.recentCommits.join('\n'));
      parts.push('```');
      parts.push('');
    }

    if (gitContext.unstagedChanges) {
      parts.push(s.git_unstaged);
      parts.push('```');
      parts.push(gitContext.unstagedChanges);
      parts.push('```');
      parts.push('');
    }

    if (gitContext.stagedChanges) {
      parts.push(s.git_staged);
      parts.push('```');
      parts.push(gitContext.stagedChanges);
      parts.push('```');
      parts.push('');
    }

    if (gitContext.latestDiff) {
      parts.push(s.git_diff_detail);
      parts.push('```diff');
      // Truncate large diffs to avoid blowing up the report
      const maxDiffLen = 8000;
      const diff = gitContext.latestDiff.length > maxDiffLen
        ? gitContext.latestDiff.slice(0, maxDiffLen) + '\n... (truncated)'
        : gitContext.latestDiff;
      parts.push(diff);
      parts.push('```');
      parts.push('');
    }
  } else {
    parts.push(s.git_no_commits);
    parts.push('');
  }

  // Project structure
  if (projectTree) {
    parts.push(s.report_project_section);
    parts.push('```');
    // Truncate very large trees
    const treeLines = projectTree.split('\n');
    if (treeLines.length > 80) {
      parts.push(treeLines.slice(0, 80).join('\n'));
      parts.push(`... (${treeLines.length - 80} more lines)`);
    } else {
      parts.push(projectTree);
    }
    parts.push('```');
    parts.push('');
  }

  // Tasks
  parts.push(s.report_task_section);
  parts.push(`1. ${s.task_1}`);
  parts.push(`2. ${s.task_2}`);
  parts.push(`3. ${s.task_3}`);
  parts.push(`4. ${s.task_4}`);
  parts.push(`5. ${s.task_5}`);
  parts.push(`6. ${s.task_6}`);
  parts.push('');

  // Missing
  if (missing.length > 0) {
    parts.push(s.report_missing_section);
    parts.push('');
    parts.push(s.report_missing_need);
    for (const m of missing) {
      parts.push(`- ${t(m.key)}`);
    }
    parts.push('');
    parts.push(s.report_missing_action);
    parts.push('');
  }

  // Stats
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const reportText = parts.join('\n');
  const reportBytes = Buffer.byteLength(reportText, 'utf-8');
  const tokens = estimateTokens(reportText);
  const codeFileCount = codeResults.length;

  parts.push(s.report_stats_section);
  parts.push('');
  parts.push('| ' + s.stats_time + ' | ' + elapsed + ' ' + s.stats_seconds + ' |');
  parts.push('| ' + s.stats_size + ' | ' + reportText.split('\n').length + ' ' + s.stats_lines + ' / ' + formatBytes(reportBytes) + ' |');
  parts.push('| ' + s.stats_tokens + ' | **~' + tokens + ' tokens** |');
  parts.push('| ' + s.stats_files + ' | ' + codeFileCount + ' (' + s.stats_auto_detected + ': ' + codeFileCount + ') |');
  parts.push('| ' + s.stats_git + ' | ' + (gitContext.hasGit ? s.stats_git_ok : s.stats_git_none) + ' |');
  parts.push('');
  parts.push('> ' + s.stats_token_note);

  return parts.join('\n');
}

// ── MCP Server setup ──
const server = new McpServer({
  name: 'debugctx',
  version: '1.0.0',
});

// analyze_bug tool
server.tool(
  'analyze_bug',
  'Call this when the user encounters ANY bug, error, crash, white screen, test failure, or unexpected behavior. Pass the error message and optionally related files.',
  {
    error_message: z.string().describe('The error message, stacktrace, or problem description'),
    related_files: z.array(z.string()).optional().describe('User-mentioned related file paths'),
    project_dir: z.string().optional().describe('Project root directory (defaults to cwd)'),
    context_lines: z.number().optional().describe('Number of context lines above/below error (default 40)'),
  },
  async ({ error_message, related_files, project_dir, context_lines }) => {
    const startTime = Date.now();
    const rootDir = project_dir || projectDir;
    const ctxLines = context_lines || 40;

    // 1. Parse error for files
    const parsedFiles = parseErrorForFiles(error_message);

    // 2. Merge with related_files
    const allFiles = new Map(parsedFiles);
    if (related_files) {
      for (const f of related_files) {
        if (!allFiles.has(f)) allFiles.set(f, null);
      }
    }

    // 3. Read code for each file
    const codeResults = [];
    for (const [filePath, line] of allFiles) {
      const errorLine = line || 1;
      const result = readCodeAtLine(filePath, errorLine, ctxLines, rootDir);
      if (result) {
        codeResults.push(result);
      }
    }

    // 4. If no files found, try searching by keywords from error message
    if (codeResults.length === 0) {
      const keywords = error_message
        .replace(/[\n\r]+/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !/^(Error|TypeError|Reference|Cannot|at|in|the|for|and|this|with|from|const|let|var|function|return|import|export)$/i.test(w))
        .slice(0, 3);

      for (const kw of keywords) {
        const searchResults = searchInProject(kw, rootDir);
        for (const sr of searchResults.slice(0, 3)) {
          const firstMatch = sr.matches[0];
          const result = readCodeAtLine(sr.file, firstMatch.line, ctxLines, rootDir);
          if (result && !codeResults.find(c => c.relativePath === sr.file)) {
            codeResults.push(result);
          }
        }
      }
    }

    // 5. Git context
    const gitContext = collectGitContext(rootDir);

    // 6. Project tree
    let projectTree = '';
    try {
      projectTree = getProjectTree(rootDir);
    } catch { /* ignore */ }

    // 7. Missing context detection
    const missing = detectMissingContext(error_message, codeResults, gitContext);

    // 8. Build report
    const report = buildReport(error_message, codeResults, gitContext, projectTree, missing, startTime, rootDir);

    return {
      content: [{ type: 'text', text: report }],
    };
  }
);

// search_project tool
server.tool(
  'search_project',
  'Search project source code by keyword. Useful for finding function definitions, class references, variable locations, etc.',
  {
    keyword: z.string().describe('Search keyword'),
    file_type: z.string().optional().describe('Limit to file extension (e.g., php, js, ts)'),
    project_dir: z.string().optional().describe('Project root directory (defaults to cwd)'),
  },
  async ({ keyword, file_type, project_dir }) => {
    const rootDir = project_dir || projectDir;
    const results = searchInProject(keyword, rootDir, file_type);

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `No results found for "${keyword}"` + (file_type ? ` in .${file_type} files` : '') }],
      };
    }

    const parts = [`# Search Results for "${keyword}"`];
    parts.push('');

    for (const r of results) {
      parts.push(`## ${r.file} (${r.totalMatches} match${r.totalMatches > 1 ? 'es' : ''})`);
      for (const m of r.matches) {
        parts.push(`  ${m.line}│ ${m.content}`);
      }
      parts.push('');
    }

    return {
      content: [{ type: 'text', text: parts.join('\n') }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write('DebugContext server error: ' + err.message + '\n');
  process.exit(1);
});
