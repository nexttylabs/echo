# Development Guide

**Project:** Echo
**Generated:** 2025-12-31

## Prerequisites

| 依赖 | 版本 | 说明 |
|------|------|------|
| **Bun** | 最新版 | 包管理器（项目使用 Bun） |
| **Node.js** | 20.x | 运行时（通过 Bun 管理） |
| **TypeScript** | 5.x | 类型系统 |

## Installation

```bash
# 安装依赖
bun install
```

## Development

```bash
# 启动开发服务器
bun dev

# 访问 http://localhost:3000
```

开发服务器启动后，访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## Build

```bash
# 生产构建
bun run build

# 启动生产服务器
bun start
```

## Linting

```bash
# 运行 ESLint
bun run lint
```

## Project Structure

```
echo/
├── app/                # Next.js App Router
├── components/         # React 组件
│   └── ui/            # Shadcn/ui 组件
├── lib/               # 工具函数
├── public/            # 静态资源
└── docs/              # 项目文档
```

## Available Scripts

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动开发服务器 |
| `bun run build` | 生产构建 |
| `bun start` | 启动生产服务器 |
| `bun run lint` | 运行代码检查 |

## Component Development

### 添加 Shadcn/ui 组件

Shadcn/ui 组件已安装在 `components/ui/` 目录。

当前组件库包括：
- alert-dialog, badge, button, card, combobox
- dropdown-menu, field, input-group, input
- label, select, separator, textarea

### 创建新组件

```tsx
// components/my-component.tsx
export function MyComponent() {
  return <div>My Component</div>;
}
```

### 使用工具函数

```tsx
import { cn } from "@/lib/utils";

// 合并 Tailwind 类名
className={cn("base-class", condition && "conditional-class")}
```

## Styling

### Tailwind CSS v4

项目使用 Tailwind CSS v4，配置在 `app/globals.css` 中：

```css
@theme inline {
  --color-primary: var(--primary);
  /* ... 更多主题变量 */
}
```

### 暗黑模式

使用 `.dark` 类选择器：

```html
<html class="dark">
```

### 色彩空间

项目使用 **OKLCH** 色彩空间，提供感知上均匀的颜色。

## Import Aliases

```typescript
@/components  → components/
@/lib         → lib/
@/components/ui → components/ui
```

## Code Quality

### TypeScript 配置

- **Strict mode:** 已启用
- **Target:** ES2017
- **Module:** ESNext (bundler resolution)

### ESLint

配置文件：`eslint.config.mjs`
- 使用 Next.js ESLint 配置

## Common Development Tasks

### 添加新页面

在 `app/` 目录创建新文件：

```
app/
├── about/
│   └── page.tsx    # /about 路由
└── dashboard/
    └── page.tsx    # /dashboard 路由
```

### 添加 API 路由

在 `app/api/` 目录创建路由处理器：

```
app/
└── api/
    └── users/
        └── route.ts  # /api/users 端点
```

### 环境变量

创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_API_URL=your_api_url
```

## Deployment Notes

### 推荐平台

- **Vercel** (Next.js 官方平台)
- 其他支持 Next.js 的托管平台

### 部署步骤

```bash
# 1. 构建项目
bun run build

# 2. 输出在 .next/ 目录
# 3. 使用 bun start 启动或部署到平台
```

## Troubleshooting

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 依赖安装失败 | 清除缓存：`rm -rf node_modules bun.lockb && bun install` |
| 端口被占用 | 修改端口或关闭占用 3000 端口的进程 |
| 类型错误 | 运行 `bun run lint` 检查 |

### 获取帮助

- 查看 [Next.js 文档](https://nextjs.org/docs)
- 查看 [Shadcn/ui 文档](https://ui.shadcn.com)
- 查看 [Tailwind CSS 文档](https://tailwindcss.com/docs)
