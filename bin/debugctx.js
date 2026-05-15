#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { detectLang, getLang, t } from '../src/i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// On Windows, prefer USERPROFILE (always valid Windows path)
// HOME in Git Bash is /c/Users/... which breaks path.join on Windows
const HOME = process.platform === 'win32'
  ? (process.env.USERPROFILE || process.env.HOME || '')
  : (process.env.HOME || '');

// ── AI tool definitions (global paths) ──
const AI_TOOLS_GLOBAL = [
  {
    name: 'Claude Code',
    detectDir: join(HOME, '.claude'),
    configPath: join(HOME, '.claude', 'mcp.json'),
    ruleFile: join(HOME, '.claude', 'CLAUDE.md'),
  },
  {
    name: 'Cursor',
    detectDir: join(HOME, '.cursor'),
    configPath: join(HOME, '.cursor', 'mcp.json'),
    ruleFile: null,
  },
  {
    name: 'Windsurf',
    detectDir: join(HOME, '.codeium'),
    configPath: join(HOME, '.codeium', 'mcp.json'),
    ruleFile: null,
  },
  {
    name: 'Cline',
    detectDir: join(HOME, '.cline'),
    configPath: join(HOME, '.cline', 'mcp.json'),
    ruleFile: null,
  },
  {
    name: 'Continue',
    detectDir: join(HOME, '.continue'),
    configPath: join(HOME, '.continue', 'debugctx.json'),
    ruleFile: null,
  },
];

// ── AI tool definitions (project-level, for init command) ──
const AI_TOOLS_PROJECT = [
  {
    name: 'Claude Code',
    detectDir: join(HOME, '.claude'),
    configPath: '.mcp.json',
    ruleFile: 'CLAUDE.md',
  },
  {
    name: 'Cursor',
    detectDir: join(HOME, '.cursor'),
    configPath: join('.cursor', 'mcp.json'),
    ruleFile: '.cursorrules',
  },
  {
    name: 'Windsurf',
    detectDir: join(HOME, '.codeium'),
    configPath: join('.windsurf', 'mcp.json'),
    ruleFile: '.windsurfrules',
  },
  {
    name: 'Cline',
    detectDir: join(HOME, '.cline'),
    configPath: join('.cline', 'mcp.json'),
    ruleFile: null,
  },
  {
    name: 'Continue',
    detectDir: join(HOME, '.continue'),
    configPath: join('.continue', 'debugctx.json'),
    ruleFile: null,
  },
];

// ── Parse args ──
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lang' && args[i + 1]) {
    flags.lang = args[i + 1];
    i++;
  } else if (args[i].startsWith('--lang=')) {
    flags.lang = args[i].split('=')[1];
  } else if (args[i] === '--help' || args[i] === '-h') {
    flags.help = true;
  } else {
    positional.push(args[i]);
  }
}

const command = positional[0];

// ── Help ──
if (flags.help || !command) {
  detectLang(flags.lang);
  console.log(`
DebugContext - AI修Bug的MCP工具

${t('cli_help_usage')}:
  npm install -g debugctx     ${t('cli_help_install')}
  npx debugctx init           ${t('cli_help_init')}
  npx debugctx init --lang zh ${t('cli_help_lang')}
  npx debugctx --help         ${t('cli_help_help')}
`);
  process.exit(0);
}

// ── Setup command (auto-config for postinstall) ──
if (command === 'setup') {
  detectLang(flags.lang);

  const serverPath = resolve(__dirname, '..', 'src', 'server.js');

  console.log();
  console.log('🔍 DebugContext: Auto-configuring AI tools...');
  console.log();

  const configured = [];
  const detected = [];

  for (const tool of AI_TOOLS_GLOBAL) {
    if (!existsSync(tool.detectDir)) continue;
    detected.push(tool.name);

    const configDir = dirname(tool.configPath);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const mcpConfig = {
      mcpServers: {
        debugctx: {
          command: 'node',
          args: [serverPath],
        },
      },
    };

    let existingConfig = {};
    if (existsSync(tool.configPath)) {
      try {
        existingConfig = JSON.parse(readFileSync(tool.configPath, 'utf-8'));
      } catch { /* ignore */ }
    }

    // Skip MCP config if already configured
    const mcpAlreadyConfigured = existingConfig.mcpServers?.debugctx?.args?.[0] === serverPath;

    if (!mcpAlreadyConfigured) {
      const merged = {
        ...existingConfig,
        mcpServers: {
          ...existingConfig.mcpServers,
          ...mcpConfig.mcpServers,
        },
      };

      writeFileSync(tool.configPath, JSON.stringify(merged, null, 2) + '\n');
      configured.push(tool.name);
    }

    // Write global rule file if applicable (always check, even if MCP was already configured)
    if (tool.ruleFile) {
      let existingRule = '';
      if (existsSync(tool.ruleFile)) {
        existingRule = readFileSync(tool.ruleFile, 'utf-8');
      }

      const marker = '<!-- debugctx -->';
      const instruction = `\n${marker}\n${t('ai_instruction')}\n${marker}\n`;

      if (existingRule.includes(marker)) {
        const newContent = existingRule.replace(
          new RegExp(`${marker}[\\s\\S]*?${marker}`, 'm'),
          instruction.trim()
        );
        writeFileSync(tool.ruleFile, newContent);
      } else {
        const newContent = existingRule.trimEnd() + '\n' + instruction;
        writeFileSync(tool.ruleFile, newContent);
      }
      if (!mcpAlreadyConfigured) {
        console.log(`  📝 ${tool.name}: wrote rule file (${basename(tool.ruleFile)})`);
      }
    }

    if (mcpAlreadyConfigured && !tool.ruleFile) {
      configured.push(tool.name + ' (already configured)');
    }
  }

  if (detected.length > 0) {
    console.log('✅ Configured for: ' + configured.join(', '));
    console.log();
    console.log('📝 Restart your AI coding tool to activate DebugContext.');
    console.log('   After restart, it works in ALL your projects automatically.');
  } else {
    console.log('ℹ️  No AI tools detected. You can run "npx debugctx init" later.');
  }

  console.log();
  process.exit(0);
}

// ── Init command (project-level config) ──
if (command === 'init') {
  const lang = flags.lang || null;
  detectLang(lang);

  const projectDir = resolve(process.cwd());
  const serverPath = resolve(__dirname, '..', 'src', 'server.js');

  console.log(t('cli_init_start'));
  console.log(`  ${t('cli_init_project')}: ${projectDir}`);
  console.log(`  ${t('cli_init_lang')}: ${getLang()}`);
  console.log();

  // Detect AI tools
  console.log(t('cli_detecting'));
  const detected = [];

  for (const tool of AI_TOOLS_PROJECT) {
    if (existsSync(tool.detectDir)) {
      detected.push(tool);
      console.log(`  ✓ ${tool.name}`);
    }
  }

  if (detected.length === 0) {
    console.log(`  ${t('cli_init_none')}`);
    console.log();
  }

  console.log();

  // Write MCP config for each detected tool
  for (const tool of detected) {
    const configFullPath = join(projectDir, tool.configPath);
    const configDir = dirname(configFullPath);

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const mcpConfig = {
      mcpServers: {
        debugctx: {
          command: 'node',
          args: [serverPath],
        },
      },
    };

    let existingConfig = {};
    if (existsSync(configFullPath)) {
      try {
        existingConfig = JSON.parse(readFileSync(configFullPath, 'utf-8'));
      } catch { /* ignore */ }
    }

    const merged = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...mcpConfig.mcpServers,
      },
    };

    writeFileSync(configFullPath, JSON.stringify(merged, null, 2) + '\n');
    console.log(`  ${t('cli_written')} ${tool.configPath} (${t('cli_init_mcp_config')})`);

    // Write rule file if applicable
    if (tool.ruleFile) {
      const rulePath = join(projectDir, tool.ruleFile);
      let existingRule = '';
      if (existsSync(rulePath)) {
        existingRule = readFileSync(rulePath, 'utf-8');
      }

      const marker = '<!-- debugctx -->';
      const instruction = `\n${marker}\n${t('ai_instruction')}\n${marker}\n`;

      if (existingRule.includes(marker)) {
        const newContent = existingRule.replace(
          new RegExp(`${marker}[\\s\\S]*?${marker}`, 'm'),
          instruction.trim()
        );
        writeFileSync(rulePath, newContent);
      } else {
        const newContent = existingRule.trimEnd() + '\n' + instruction;
        writeFileSync(rulePath, newContent);
      }
      console.log(`  ${t('cli_written')} ${tool.ruleFile} (${t('cli_init_rule_file')})`);
    }
  }

  // Write .debugctx/config.json
  const debugCtxDir = join(projectDir, '.debugctx');
  if (!existsSync(debugCtxDir)) {
    mkdirSync(debugCtxDir, { recursive: true });
  }

  const configContent = {
    language: lang || getLang(),
    version: '1.0.0',
  };

  writeFileSync(join(debugCtxDir, 'config.json'), JSON.stringify(configContent, null, 2) + '\n');
  console.log(`  ${t('cli_written')} .debugctx/config.json (${t('cli_init_config_file')})`);

  console.log();
  console.log(t('cli_init_done'));
  console.log();
  console.log(t('cli_init_restart'));
  process.exit(0);
}

// ── Unknown command ──
console.error(`Unknown command: ${command}`);
console.error('Run `npx debugctx --help` for usage.');
process.exit(1);
