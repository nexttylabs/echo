# Source Tree Analysis

**Project:** Echo
**Type:** Web Application (Next.js + React + TypeScript)
**Generated:** 2025-12-31

## Directory Structure

```
echo/                          # 项目根目录
├── _bmad/                      # BMAD 模块配置（工作流系统）
│   ├── core/                   # 核心工作流和任务
│   └── bmm/                    # BMM 方法论工作流
├── _bmad-output/               # BMAD 输出目录
│   ├── planning-artifacts/     # 规划文档
│   └── implementation-artifacts/ # 实施工件
├── app/                        # Next.js App Router 目录 ⭐
│   ├── layout.tsx              # 根布局组件
│   ├── page.tsx                # 首页
│   ├── globals.css             # 全局样式 + Tailwind 配置
│   └── favicon.ico             # 网站图标
├── components/                 # React 组件目录 ⭐
│   ├── ui/                     # Shadcn/ui 基础组件（14个）
│   │   ├── alert-dialog.tsx    # 警告对话框
│   │   ├── badge.tsx           # 徽章
│   │   ├── button.tsx          # 按钮
│   │   ├── card.tsx            # 卡片
│   │   ├── combobox.tsx        # 组合框
│   │   ├── dropdown-menu.tsx   # 下拉菜单
│   │   ├── field.tsx           # 表单字段
│   │   ├── input-group.tsx     # 输入组
│   │   ├── input.tsx           # 输入框
│   │   ├── label.tsx           # 标签
│   │   ├── select.tsx          # 选择器
│   │   ├── separator.tsx       # 分隔符
│   │   └── textarea.tsx        # 文本域
│   ├── component-example.tsx   # 示例组件
│   └── example.tsx             # 示例
├── lib/                        # 工具函数目录 ⭐
│   └── utils.ts                # 通用工具（cn 函数等）
├── public/                     # 静态资源目录
├── docs/                       # 项目文档
│   ├── project-scan-report.json # 项目扫描状态
│   └── (生成文档将在此处创建)
├── node_modules/               # 依赖包
├── package.json                # 项目配置和依赖 ⭐
├── tsconfig.json               # TypeScript 配置 ⭐
├── next.config.ts              # Next.js 配置
├── components.json             # Shadcn/ui 配置 ⭐
├── postcss.config.mjs          # PostCSS 配置
├── eslint.config.mjs           # ESLint 配置
├── CLAUDE.md                   # Claude Code 项目指令
└── README.md                   # 项目说明
```

## Critical Directories Explained

### `/app` - Next.js App Router
Next.js 13+ 的 App Router 目录，使用基于文件系统的路由。

| 文件/目录 | 用途 |
|-----------|------|
| `layout.tsx` | 根布局，定义页面结构和共享 UI |
| `page.tsx` | 主页（/ 路由）|
| `globals.css` | 全局样式，包含 Tailwind 主题配置 |
| `favicon.ico` | 网站图标 |

**架构模式：** React Server Components (RSC) enabled

### `/components` - React 组件
可复用的 UI 组件目录。

| 子目录 | 用途 |
|--------|------|
| `ui/` | Shadcn/ui 基础组件库 |
| 根目录 | 自定义组件 |

**组件库：**
- **Shadcn/ui 3.6.2** (Radix UI primitives + Base UI)
- **图标：** Lucide React 0.562.0
- **样式变体：** radix-maia
- **基础颜色：** neutral

### `/lib` - 工具函数
共享工具函数和帮助器。

| 文件 | 用途 |
|------|------|
| `utils.ts` | `cn()` 函数 - 合并 Tailwind 类名（clsx + tailwind-merge）|

## Entry Points

| 类型 | 位置 | 描述 |
|------|------|------|
| **应用入口** | `app/layout.tsx` | 根布局组件 |
| **首页** | `app/page.tsx` | 主页路由 |
| **全局样式** | `app/globals.css` | Tailwind 主题配置 |

## Key Configuration Files

| 文件 | 用途 |
|------|------|
| `package.json` | 项目元数据和依赖 |
| `tsconfig.json` | TypeScript 编译配置 |
| `components.json` | Shadcn/ui 组件配置 |
| `next.config.ts` | Next.js 框架配置 |

## Import Aliases

配置在 `tsconfig.json` 和 `components.json` 中：

```typescript
@/components  → components/
@/lib         → lib/
@/components/ui → components/ui
@/hooks       → hooks/ (尚未创建)
```

## Architecture Notes

1. **路由系统：** Next.js App Router (文件系统路由)
2. **渲染模式：** React Server Components + Client Components
3. **样式方案：** Tailwind CSS v4 (inline config with @theme)
4. **组件系统：** Shadcn/ui (Radix UI primitives)
5. **类型系统：** TypeScript 5.x (strict mode enabled)
6. **色彩空间：** OKLCH (perceptually uniform colors)
7. **暗黑模式：** 自定义实现 (`.dark` class selector)

## Development Patterns

### 未实现的功能区域

以下功能区域在当前项目中尚未实现：

- ❌ API 路由（无 `/app/api` 目录）
- ❌ 数据模型/数据库
- ❌ 状态管理（无 Redux/Zustand/Context store）
- ❌ 认证/授权系统
- ❌ 测试套件
- ❌ CI/CD 配置
- ❌ Docker/容器化
- ❌ 中间件

### 当前实现

- ✅ 基础 Next.js 项目结构
- ✅ Shadcn/ui 组件库（14 个基础组件）
- ✅ Tailwind CSS 主题配置
- ✅ TypeScript 类型检查
- ✅ ESLint 代码规范
