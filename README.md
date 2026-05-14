# DebugContext

[中文文档](README.zh.md)

> Fix bugs in one shot with AI-powered context gathering

DebugContext is an MCP Server that works as a plugin for AI coding tools like Claude Code, Cursor, and Windsurf. When a developer encounters a bug, it automatically extracts file paths and line numbers from error messages, reads the relevant source code, collects Git change context, and generates a structured analysis report — so the AI can fix the bug on the first try.

## The Problem

```
Before: User pastes error → AI guesses → wrong fix → guesses again → wastes tokens
After:  User pastes error → DebugContext gathers context → AI fixes it correctly in one shot
```

## Quick Start

```bash
npm install -g debugctx
```

That's it. Auto-detects your AI tools, configures MCP globally. Restart your AI tool and it works in ALL projects.

**Or run per-project:**
```bash
npx debugctx init
```

## Supported AI Tools

| Tool | Supported |
|------|-----------|
| Claude Code | ✓ |
| Cursor | ✓ |
| Windsurf | ✓ |
| Cline | ✓ |
| Continue | ✓ |

## How It Works

When the AI encounters an error, it automatically calls the `analyze_bug` tool:

1. **Error parsing** — Regex matches error formats from 14 programming languages, extracts file paths and line numbers
2. **Code reading** — Automatically reads code around the error line (N lines above and below)
3. **Git collection** — Collects the last 8 commits, unstaged changes, and the latest commit diff
4. **Project scanning** — Scans the project file structure to help AI understand code organization
5. **Missing context detection** — Detects whether context is sufficient, tells AI what to ask the user
6. **Token statistics** — Shows analysis time, report size, and estimated token consumption at the end

## Supported Error Formats

| Language | Example Format |
|----------|---------------|
| JavaScript / TypeScript | `at func (file.js:42:10)` |
| JSX / TSX / Vue | `at Component (file.jsx:42:10)` |
| Python | `File "file.py", line 42` |
| PHP | `in /path/file.php on line 42` |
| Go | `file.go:42` |
| Ruby | `file.rb:42` |
| Java | `at com.example.File.java:42` |
| Rust | `at file.rs:42:10` |
| CSS / SCSS | `file.css:42` |
| HTML | `file.html:42` |

## MCP Tools

### analyze_bug

Automatically called by the AI when a user encounters any bug, error, crash, or unexpected behavior.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error_message` | string | Yes | Error message, stacktrace, or problem description |
| `related_files` | string[] | No | User-mentioned related file paths |
| `project_dir` | string | No | Project root directory (defaults to cwd) |
| `context_lines` | number | No | Lines of context above/below error (default 40) |

### search_project

Search project source code by keyword to find function definitions, class references, variable locations, etc.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Search keyword |
| `file_type` | string | No | Limit to file extension (e.g. `php`, `js`) |
| `project_dir` | string | No | Project root directory (defaults to cwd) |

## Multi-language

The tool auto-detects system language, supporting Chinese and English.

```bash
npx debugctx init              # Auto-detect system language
npx debugctx init --lang zh    # Force Chinese
npx debugctx init --lang en    # Force English
```

Detection priority: `--lang` flag > system env vars > default English

## Manual Configuration

If auto-detection doesn't work, add the following to your AI tool's MCP config:

```json
{
  "mcpServers": {
    "debugctx": {
      "command": "node",
      "args": ["/absolute/path/to/debugctx/src/server.js"]
    }
  }
}
```

Config file locations (global install writes here):

| Tool | Config File |
|------|-------------|
| Claude Code | `~/.claude/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/mcp.json` |
| Cline | `~/.cline/mcp.json` |
| Continue | `~/.continue/debugctx.json` |

## Requirements

- Node.js >= 18
- Windows / macOS / Linux

## License

[GNU General Public License v3.0](LICENSE)
