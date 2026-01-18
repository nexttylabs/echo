# Project Documentation Index

**Project:** Echo
**Type:** Monolith Web Application
**Primary Language:** TypeScript
**Architecture:** Next.js App Router + React Server Components
**Last Updated:** 2025-12-31

---

## Project Overview

- **Type:** Monolith
- **Primary Language:** TypeScript 5.x
- **Primary Framework:** Next.js 16.1.1 + React 19.2.3
- **Architecture Pattern:** App Router + React Server Components
- **Package Manager:** Bun

---

## Quick Reference

| 属性 | 值 |
|------|-----|
| **项目名称** | Echo |
| **项目类型** | Web 应用 - 用户反馈系统 |
| **主语言** | TypeScript 5.x (strict mode) |
| **框架** | Next.js 16.1.1 + React 19.2.3 |
| **入口点** | `app/page.tsx` |
| **架构模式** | App Router + React Server Components |

---

## Generated Documentation

### Core Documentation

- [Project Overview](./project-overview.md) - 项目概览和快速参考
- [Architecture](./architecture.md) - 系统架构详细说明
- [Source Tree Analysis](./source-tree-analysis.md) - 源代码树结构
- [Component Inventory](./component-inventory.md) - 组件清单和使用指南
- [Development Guide](./development-guide.md) - 开发设置和工作流程

---

## Existing Documentation

- [README.md](../README.md) - Next.js 标准启动文档
- [CLAUDE.md](../CLAUDE.md) - Claude Code 项目指令

---

## Technology Stack

### Core Framework

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.1 | React 框架（App Router）|
| React | 19.2.3 | UI 库（RSC enabled）|
| TypeScript | 5.x | 类型系统（strict mode）|

### Styling & Components

| 技术 | 版本 | 用途 |
|------|------|------|
| Tailwind CSS | 4.x | 实用优先的 CSS 框架 |
| Shadcn/ui | 3.6.2 | 组件系统 |
| Radix UI | 1.4.3 | 无障碍基础组件 |
| Base UI | 1.0.0 | React 基础组件 |
| Lucide React | 0.562.0 | 图标库 |

---

## Repository Structure

```
echo/
├── app/                   # Next.js App Router ⭐
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式 + Tailwind 配置
├── components/            # React 组件 ⭐
│   ├── ui/               # Shadcn/ui 基础组件（14 个）
│   ├── component-example.tsx
│   └── example.tsx
├── lib/                   # 工具函数 ⭐
│   └── utils.ts          # cn() 函数等
├── docs/                  # 项目文档
├── public/                # 静态资源
├── package.json           # 项目配置 ⭐
├── tsconfig.json          # TypeScript 配置 ⭐
└── components.json        # Shadcn/ui 配置 ⭐
```

---

## Import Aliases

```typescript
@/components     → components/
@/lib            → lib/
@/components/ui  → components/ui
```

---

## Getting Started

### Prerequisites

- Bun (最新版)
- Node.js 20.x

### Installation

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 访问 http://localhost:3000
```

### Available Scripts

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动开发服务器 |
| `bun run build` | 生产构建 |
| `bun start` | 启动生产服务器 |
| `bun run lint` | 运行代码检查 |

---

## Component Library

### Shadcn/ui Components (14 个)

**Form Components:** Input, Textarea, Label, Field, Input Group, Select, Combobox
**Action Components:** Button, Dropdown Menu, Alert Dialog
**Layout Components:** Card, Separator
**Display Components:** Badge

详见：[Component Inventory](./component-inventory.md)

---

## Current Implementation Status

### ✅ 已实现

- Next.js 项目结构
- Shadcn/ui 组件库（14 个基础组件）
- Tailwind CSS 主题配置
- TypeScript 类型检查
- ESLint 代码规范

### ❌ 未实现

- API 路由
- 数据库/数据模型
- 状态管理
- 用户认证
- 测试套件
- CI/CD 配置

---

## Architecture Notes

- **路由系统：** Next.js App Router（文件系统路由）
- **渲染模式：** React Server Components + Client Components
- **样式方案：** Tailwind CSS v4（inline config）
- **组件系统：** Shadcn/ui（Radix UI primitives）
- **类型系统：** TypeScript 5.x（strict mode）
- **色彩空间：** OKLCH（感知上均匀的颜色）
- **暗黑模式：** 自定义实现（`.dark` class selector）

---

## Documentation for AI-Assisted Development

当使用 AI 辅助开发时，请参考以下文档：

1. **新功能规划** - 参考 [Architecture](./architecture.md) 了解系统设计
2. **组件开发** - 参考 [Component Inventory](./component-inventory.md) 了解可用组件
3. **代码规范** - 参考 [Development Guide](./development-guide.md) 了解开发流程
4. **项目结构** - 参考 [Source Tree Analysis](./source-tree-analysis.md) 了解代码组织

---

## Project Status

**阶段：** 初始化/脚手架
**最后更新：** 2025-12-31

项目处于早期开发阶段，已建立基础架构和开发环境。

---

## BMad Method Workflow

本项目使用 BMad Method 工作流进行规划。

**工作流状态：** `_bmad-output/planning-artifacts/bmm-workflow-status.yaml`

**下一步：** document-project → brainstorm-project → PRD

---

*此文档由 BMad Document Project 工作流自动生成*
