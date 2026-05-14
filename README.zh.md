# DebugContext

[English](README.md)

> 让 AI 一次修对 Bug 的 MCP 工具

DebugContext 是一个 MCP Server，作为 Claude Code、Cursor、Windsurf 等 AI 编程工具的插件运行。当开发者遇到 Bug 时，自动从报错信息中提取文件路径和行号，读取相关源代码，收集 Git 改动上下文，生成结构化分析报告，让 AI 一次修对 Bug。

## 解决的问题

```
之前：用户贴报错 → AI 猜 → 改错 → 再猜 → 浪费 Token
之后：用户贴报错 → DebugContext 自动收集上下文 → AI 基于完整信息一次修对
```

## 一行安装

```bash
npm install -g debugctx
```

搞定。自动检测 AI 工具，全局配置 MCP，重启 AI 工具后所有项目直接生效。

**或在单个项目中配置：**
```bash
npx debugctx init
```

## 支持的 AI 工具

| 工具 | 支持 |
|------|------|
| Claude Code | ✓ |
| Cursor | ✓ |
| Windsurf | ✓ |
| Cline | ✓ |
| Continue | ✓ |

## 工作原理

当 AI 遇到报错时，自动调用 `analyze_bug` 工具：

1. **报错解析** — 正则匹配 14 种编程语言的报错格式，提取文件路径和行号
2. **代码读取** — 自动读取报错行附近代码（前后各 N 行）
3. **Git 收集** — 收集最近 8 次提交、未暂存改动、最近一次提交的 diff
4. **项目扫描** — 扫描项目文件结构，帮助 AI 理解代码组织
5. **缺失检测** — 检测上下文是否足够，告诉 AI 还需要问用户要什么
6. **Token 统计** — 报告末尾显示分析耗时、报告大小、估算 Token 消耗

## 支持的报错格式

| 编程语言 | 报错格式示例 |
|----------|-------------|
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

## MCP 工具

### analyze_bug

当用户遇到任何 Bug、报错、异常行为时，AI 自动调用此工具获取完整上下文。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `error_message` | string | 是 | 报错信息、错误日志或问题描述 |
| `related_files` | string[] | 否 | 用户提到的相关文件路径 |
| `project_dir` | string | 否 | 项目根目录（默认当前目录） |
| `context_lines` | number | 否 | 报错行号前后显示多少行代码（默认 40） |

### search_project

在项目源码中搜索关键词，找到函数定义、类引用、变量位置等。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词 |
| `file_type` | string | 否 | 限定文件扩展名（如 `php`、`js`） |
| `project_dir` | string | 否 | 项目根目录（默认当前目录） |

## 多语言

工具自动检测系统语言，支持中文和 English。

```bash
npx debugctx init              # 自动检测系统语言
npx debugctx init --lang zh    # 手动指定中文
npx debugctx init --lang en    # 手动指定英文
```

语言检测优先级：`--lang` 参数 > 系统环境变量 > 默认英文

## 手动配置

如果自动检测不生效，可以手动在 AI 工具的 MCP 配置中添加：

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

各工具配置文件位置（全局安装时自动写入）：

| 工具 | 配置文件 |
|------|---------|
| Claude Code | `~/.claude/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/mcp.json` |
| Cline | `~/.cline/mcp.json` |
| Continue | `~/.continue/debugctx.json` |

## 系统要求

- Node.js >= 18
- Windows / macOS / Linux

## 许可证

[GNU General Public License v3.0](LICENSE)
