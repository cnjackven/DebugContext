const langs = {
  zh: {
    // CLI
    cli_init_start: '🔧 DebugContext 初始化中...',
    cli_init_done: '✅ 初始化完成！',
    cli_init_project: '项目目录',
    cli_init_lang: '语言',
    cli_init_ai_tools: '检测到的 AI 工具',
    cli_init_none: '未检测到支持的 AI 工具',
    cli_init_wrote: '已写入配置',
    cli_init_mcp_config: 'MCP 配置',
    cli_init_rule_file: '规则文件',
    cli_init_config_file: '配置文件',
    cli_init_restart: '请重启你的 AI 编程工具以生效',
    cli_help_usage: '用法',
    cli_help_install: '全局安装并自动配置（推荐）',
    cli_help_init: '在当前项目初始化配置',
    cli_help_lang: '指定语言（zh 或 en）',
    cli_help_help: '显示帮助信息',
    cli_detecting: '正在检测 AI 工具...',
    cli_skip_existing: '已存在，跳过',
    cli_writing: '写入中...',
    cli_written: '已写入',

    // AI instructions (written to rule files)
    ai_instruction: `# DebugContext 使用指南

当遇到以下情况时，必须先调用 analyze_bug 工具获取上下文再修复：
- 代码运行报错 / 异常堆栈
- 页面白屏 / 功能不正常
- 测试失败
- 用户描述了一个 Bug 或贴了截图

拿到工具返回的分析报告后，基于报告中的上下文进行修复。
不要凭猜测修改代码。

如果上下文不足，按报告中的提示向用户询问所需信息。`,

    // Report
    report_title: '# DebugContext 分析报告',
    report_error_section: '## 报错 / 问题描述',
    report_code_section: '## 相关代码',
    report_git_section: '## Git 上下文',
    report_project_section: '## 项目结构',
    report_task_section: '## 分析任务',
    report_missing_section: '## ⚠ 上下文不足',
    report_missing_need: '**需要用户提供更多信息：**',
    report_missing_action: '**请先向用户询问以上信息，拿到后再分析。**',
    report_stats_section: '## 📊 本次分析统计',

    // Code
    code_lines: '行',
    code_show_range: '显示第 {start}-{end} 行',
    code_error_line: '← 报错行',
    code_total_lines: '共 {count} 行',

    // Git
    git_commits: '### 最近提交',
    git_unstaged: '### 未提交的改动',
    git_staged: '### 已暂存的改动',
    git_diff_detail: '### 最近一次提交的改动详情',
    git_no_commits: '无提交记录',
    git_no_changes: '无未提交改动',
    git_hours_ago: '{n} 小时前',
    git_minutes_ago: '{n} 分钟前',
    git_days_ago: '{n} 天前',
    git_just_now: '刚刚',

    // Tasks
    task_1: '精确定位报错对应的代码位置',
    task_2: '分析根因',
    task_3: '检查是否是最近改动引入的问题',
    task_4: '给出最小改动的修复代码',
    task_5: '评估影响',
    task_6: '如果上下文不足，明确指出还需要什么信息',

    // Missing
    missing_short_error: '报错信息太短（不到50字符），可能是不完整的错误信息',
    missing_no_files: '未找到报错相关的源码文件',
    missing_short_files: '找到的文件内容太短，可能不是出问题的文件',
    missing_no_git: '项目不在 Git 仓库中，无法分析最近改动',
    missing_no_expect: '报错中没有期望行为描述，可以问用户期望的结果是什么',
    missing_env_error: '可能是环境问题，请用户提供运行环境信息',
    missing_file_hint: '请用户提供完整的错误信息或报错截图',
    missing_file_confirm: '请用户确认是哪个文件出了问题',

    // Stats
    stats_time: '分析耗时',
    stats_size: '报告大小',
    stats_tokens: '估算Token消耗',
    stats_files: '读取文件数',
    stats_git: 'Git上下文',
    stats_git_ok: '已收集',
    stats_git_none: '无',
    stats_auto_detected: '自动检测',
    stats_seconds: '秒',
    stats_kb: 'KB',
    stats_token_note: '以上Token为DebugContext报告的估算值，AI处理时的实际消耗会更高',
    stats_lines: '行',
  },

  en: {
    // CLI
    cli_init_start: '🔧 DebugContext initializing...',
    cli_init_done: '✅ Initialization complete!',
    cli_init_project: 'Project directory',
    cli_init_lang: 'Language',
    cli_init_ai_tools: 'Detected AI tools',
    cli_init_none: 'No supported AI tools detected',
    cli_init_wrote: 'Written',
    cli_init_mcp_config: 'MCP config',
    cli_init_rule_file: 'Rule file',
    cli_init_config_file: 'Config file',
    cli_init_restart: 'Please restart your AI coding tool to apply changes',
    cli_help_usage: 'Usage',
    cli_help_install: 'Global install with auto-config (recommended)',
    cli_help_init: 'Initialize config in current project',
    cli_help_lang: 'Specify language (zh or en)',
    cli_help_help: 'Show help message',
    cli_detecting: 'Detecting AI tools...',
    cli_skip_existing: 'Already exists, skipping',
    cli_writing: 'Writing...',
    cli_written: 'Written',

    // AI instructions
    ai_instruction: `# DebugContext Usage Guide

You MUST call the analyze_bug tool before fixing when:
- Code throws an error / exception stacktrace
- Page is blank / feature not working
- Tests are failing
- User describes a bug or pastes a screenshot

After receiving the analysis report, fix based on the context in the report.
Do not guess at fixes.

If context is insufficient, ask the user for the needed information as indicated in the report.`,

    // Report
    report_title: '# DebugContext Analysis Report',
    report_error_section: '## Error / Problem Description',
    report_code_section: '## Related Code',
    report_git_section: '## Git Context',
    report_project_section: '## Project Structure',
    report_task_section: '## Analysis Tasks',
    report_missing_section: '## ⚠ Insufficient Context',
    report_missing_need: '**Need user to provide more information:**',
    report_missing_action: '**Please ask the user for the above information before analyzing.**',
    report_stats_section: '## 📊 Analysis Statistics',

    // Code
    code_lines: 'lines',
    code_show_range: 'Showing lines {start}-{end}',
    code_error_line: '← error line',
    code_total_lines: '{count} lines total',

    // Git
    git_commits: '### Recent Commits',
    git_unstaged: '### Unstaged Changes',
    git_staged: '### Staged Changes',
    git_diff_detail: '### Latest Commit Diff',
    git_no_commits: 'No commit history',
    git_no_changes: 'No unstaged changes',
    git_hours_ago: '{n} hours ago',
    git_minutes_ago: '{n} minutes ago',
    git_days_ago: '{n} days ago',
    git_just_now: 'just now',

    // Tasks
    task_1: 'Precisely locate the code position corresponding to the error',
    task_2: 'Analyze root cause',
    task_3: 'Check if recent changes introduced the issue',
    task_4: 'Provide minimal fix code',
    task_5: 'Assess impact',
    task_6: 'If context is insufficient, clearly state what additional information is needed',

    // Missing
    missing_short_error: 'Error message is too short (under 50 chars), may be incomplete',
    missing_no_files: 'No source files found related to the error',
    missing_short_files: 'Found files are too short, may not be the problematic file',
    missing_no_git: 'Project is not in a Git repository, cannot analyze recent changes',
    missing_no_expect: 'No expected behavior described in the error, can ask user what they expected',
    missing_env_error: 'May be an environment issue, ask user for environment info',
    missing_file_hint: 'Ask user for the complete error message or error screenshot',
    missing_file_confirm: 'Ask user to confirm which file has the problem',

    // Stats
    stats_time: 'Analysis time',
    stats_size: 'Report size',
    stats_tokens: 'Estimated token usage',
    stats_files: 'Files read',
    stats_git: 'Git context',
    stats_git_ok: 'Collected',
    stats_git_none: 'None',
    stats_auto_detected: 'auto-detected',
    stats_seconds: 'seconds',
    stats_kb: 'KB',
    stats_token_note: 'Tokens above are estimates for the DebugContext report; actual AI processing cost will be higher',
    stats_lines: 'lines',
  },
};

import { execSync } from 'node:child_process';

let currentLang = 'en';

function detectSystemLang() {
  // 1. Environment variables (Unix / macOS / WSL)
  const envLang = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANGUAGE || '';
  if (/^zh/i.test(envLang)) return 'zh';
  // If env var is set and recognized, use it directly
  if (envLang && !/^en/i.test(envLang)) return 'en';

  // 2. Platform-specific detection
  if (process.platform === 'win32') {
    // PowerShell: read CurrentUICulture
    try {
      const result = execSync(
        'powershell -NoProfile -Command "[System.Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName"',
        { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 5000 }
      ).trim();
      if (/^zh/i.test(result)) return 'zh';
    } catch { /* ignore */ }

    // Fallback: Windows registry code page (936=GBK Simplified Chinese, 950=Big5 Traditional Chinese)
    try {
      const result = execSync(
        'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Nls\\CodePage" /v ACP',
        { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 5000 }
      );
      if (/936|950/.test(result)) return 'zh';
    } catch { /* ignore */ }
  } else if (process.platform === 'darwin') {
    // macOS: read AppleLanguages preference
    try {
      const result = execSync('defaults read .GlobalPreferences AppleLanguages', {
        stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 3000
      });
      if (/zh/i.test(result)) return 'zh';
    } catch { /* ignore */ }
  } else {
    // Linux / other: try `locale` command, then read /etc/locale.conf
    try {
      const result = execSync('locale -a 2>/dev/null | head -1', {
        stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 3000
      });
      if (/zh/i.test(result)) return 'zh';
    } catch { /* ignore */ }

    try {
      const conf = execSync('cat /etc/locale.conf 2>/dev/null', {
        stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 3000
      });
      if (/zh/i.test(conf)) return 'zh';
    } catch { /* ignore */ }
  }

  return 'en';
}

export function detectLang(explicit) {
  if (explicit && langs[explicit]) {
    currentLang = explicit;
    return currentLang;
  }
  currentLang = detectSystemLang();
  return currentLang;
}

export function t(key, replacements) {
  const str = langs[currentLang]?.[key] || langs.en[key] || key;
  if (!replacements) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => replacements[k] !== undefined ? replacements[k] : `{${k}}`);
}

export function getAllStrings() {
  return langs[currentLang] || langs.en;
}

export function getLang() {
  return currentLang;
}
