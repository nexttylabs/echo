# Project Overview

**Project:** Echo
**Type:** Web Application
**Purpose:** 用户反馈系统
**Generated:** 2025-12-31

## Executive Summary

Echo 是一个现代化的 Web 应用，使用 Next.js 16 和 React 19 构建，旨在让用户通过 Web 页面反馈应用或服务的使用情况。项目采用 App Router 架构、React Server Components 和 TypeScript 严格模式，使用 Shadcn/ui 作为组件库，Tailwind CSS v4 进行样式管理。

## Quick Reference

| 属性 | 值 |
|------|-----|
| **项目类型** | 单体 Web 应用 |
| **主语言** | TypeScript 5.x |
| **框架** | Next.js 16.1.1 + React 19.2.3 |
| **架构模式** | App Router + React Server Components |
| **包管理器** | Bun |
| **代码库** | `/Users/derek/Workspaces/echo` |

## Technology Stack Summary

### Frontend

| 类别 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js | 16.1.1 |
| **UI 库** | React | 19.2.3 |
| **语言** | TypeScript | 5.x (strict) |
| **样式** | Tailwind CSS | 4.x |
| **组件库** | Shadcn/ui | 3.6.2 |
| **基础组件** | Base UI | 1.0.0 |
| **Radix UI** | Radix UI | 1.4.3 |
| **图标** | Lucide React | 0.562.0 |

### Development Tools

| 工具 | 用途 |
|------|------|
| **Bun** | 包管理器和运行时 |
| **ESLint** | 代码检查 |
| **TypeScript** | 类型检查 |

## Repository Structure

```
echo/                      # 项目根目录
├── app/                   # Next.js App Router
├── components/            # React 组件
│   └── ui/               # Shadcn/ui 基础组件（14 个）
├── lib/                   # 工具函数
├── docs/                  # 项目文档
├── public/                # 静态资源
└── _bmad/                 # BMAD 工作流系统
```

## Architecture Classification

| 维度 | 分类 |
|------|------|
| **应用类型** | 单体应用 (Monolith) |
| **渲染模式** | 混合（Server + Client Components）|
| **路由系统** | 文件系统路由 (App Router) |
| **样式方案** | 实用优先 CSS (Tailwind) |
| **状态管理** | 未实现 |

## Current Implementation Status

### ✅ 已实现

| 功能 | 状态 |
|------|------|
| Next.js 项目结构 | ✅ |
| Shadcn/ui 组件库 | ✅ (14 个基础组件) |
| Tailwind CSS 主题 | ✅ |
| TypeScript 类型检查 | ✅ |
| ESLint 代码规范 | ✅ |
| 开发/构建脚本 | ✅ |

### ❌ 未实现

| 功能 | 状态 |
|------|------|
| API 路由 | ❌ |
| 数据库 | ❌ |
| 状态管理 | ❌ |
| 用户认证 | ❌ |
| 测试套件 | ❌ |
| CI/CD | ❌ |
| Docker 配置 | ❌ |

## Project Status

**阶段：** 初始化/脚手架

项目处于早期开发阶段，已建立基础架构和开发环境，但核心功能尚未实现。

## Documentation Index

| 文档 | 描述 |
|------|------|
| [Architecture](./architecture.md) | 系统架构详细说明 |
| [Source Tree Analysis](./source-tree-analysis.md) | 源代码树结构 |
| [Component Inventory](./component-inventory.md) | 组件清单 |
| [Development Guide](./development-guide.md) | 开发指南 |

## Existing Documentation

| 文档 | 位置 | 描述 |
|------|------|------|
| README.md | `/` | Next.js 标准启动文档 |
| CLAUDE.md | `/` | Claude Code 项目指令 |

## Getting Started

### 快速开始

```bash
# 1. 安装依赖
bun install

# 2. 启动开发服务器
bun dev

# 3. 访问应用
open http://localhost:3000
```

### 可用命令

```bash
bun dev          # 开发服务器
bun run build    # 生产构建
bun start        # 生产服务器
bun run lint     # 代码检查
```

## Development Setup

详细开发设置请参阅：[Development Guide](./development-guide.md)

## Next Steps

1. **核心功能开发** - 实现反馈系统的核心功能
2. **API 设计** - 设计和实现 API 端点
3. **数据层** - 添加数据库和 ORM
4. **状态管理** - 实现客户端状态管理
5. **测试** - 添加测试套件
6. **部署** - 配置 CI/CD 和部署流程

## Contributing

本项目使用 BMad Method 工作流进行开发。查看 `_bmad-output/planning-artifacts/` 目录获取规划文档。

## License

未指定
