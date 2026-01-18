# Component Inventory

**Project:** Echo
**Generated:** 2025-12-31

## Overview

项目使用 **Shadcn/ui 3.6.2** 组件库，基于 Radix UI primitives 和 Base UI 构建。

## Design System Configuration

| 配置 | 值 |
|------|-----|
| **样式变体** | radix-maia |
| **基础颜色** | neutral |
| **图标库** | lucide-react |
| **RSC** | enabled |
| **CSS 变量** | enabled |

## Shadcn/ui Components (14 个)

### Form Components

| 组件 | 文件 | 描述 |
|------|------|------|
| **Input** | `input.tsx` | 单行文本输入 |
| **Textarea** | `textarea.tsx` | 多行文本输入 |
| **Label** | `label.tsx` | 表单标签 |
| **Field** | `field.tsx` | 表单字段包装器 |
| **Input Group** | `input-group.tsx` | 输入组容器 |
| **Select** | `select.tsx` | 下拉选择器 |
| **Combobox** | `combobox.tsx` | 组合输入/搜索 |

### Action Components

| 组件 | 文件 | 描述 |
|------|------|------|
| **Button** | `button.tsx` | 按钮（多种变体）|
| **Dropdown Menu** | `dropdown-menu.tsx` | 下拉菜单 |
| **Alert Dialog** | `alert-dialog.tsx` | 警告/确认对话框 |

### Layout Components

| 组件 | 文件 | 描述 |
|------|------|------|
| **Card** | `card.tsx` | 卡片容器 |
| **Separator** | `separator.tsx` | 分隔线 |

### Display Components

| 组件 | 文件 | 描述 |
|------|------|------|
| **Badge** | `badge.tsx` | 徽章/标签 |

## Component Usage

### Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Card

```tsx
import { Card } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Input

```tsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text..." />
```

## Custom Components

| 组件 | 文件 | 描述 | 状态 |
|------|------|------|------|
| **ComponentExample** | `component-example.tsx` | 示例组件 | ✅ |
| **Example** | `example.tsx` | 简单示例 | ✅ |

## Reusable Patterns

### cn() Utility

合并 Tailwind 类名：

```tsx
import { cn } from "@/lib/utils";

className={cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
)}
```

### Component Variants

使用 `class-variance-authority` 管理变体：

```tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        outline: "outline-classes",
      },
    },
  }
);
```

## Component Organization

```
components/
├── ui/                    # Shadcn/ui 基础组件（不要直接修改）
│   ├── alert-dialog.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── combobox.tsx
│   ├── dropdown-menu.tsx
│   ├── field.tsx
│   ├── input-group.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   └── textarea.tsx
├── component-example.tsx  # 自定义组件
└── example.tsx
```

## Adding New Components

### Option 1: Add Shadcn/ui Component

使用 Shadcn CLI 添加新组件：

```bash
npx shadcn@latest add [component-name]
```

例如：
```bash
npx shadcn@latest add dialog
npx shadcn@latest add tooltip
npx shadcn@latest add switch
```

### Option 2: Create Custom Component

1. 在 `components/` 创建新文件
2. 使用 Shadcn/ui 组件作为基础
3. 应用项目样式变体

```tsx
// components/my-feature.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MyFeature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}
```

## Styling Conventions

### Tailwind Integration

所有组件使用 Tailwind CSS 实用类：

```tsx
className="flex items-center justify-between p-4 rounded-lg"
```

### Theme Variables

使用 CSS 自定义属性：

```tsx
className="bg-primary text-primary-foreground"
```

可用变量：
- `background`, `foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `accent`, `accent-foreground`
- `muted`, `muted-foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `border`, `input`, `ring`

## Icon Usage

使用 Lucide React 图标：

```tsx
import { ChevronLeft, Search, User } from "lucide-react";

<ChevronLeft className="h-4 w-4" />
<Search className="h-5 w-5" />
<User className="h-6 w-6" />
```

## Component Best Practices

1. **优先使用 Shadcn/ui 组件** - 避免重复造轮
2. **直接修改 ui/ 组件** - 项目采用直接修改方式，不是重新安装
3. **使用 cn() 合并类名** - 保持类名可预测
4. **遵循命名约定** - PascalCase 用于组件
5. **保持组件小而专注** - 单一职责原则

## Missing Components

以下常用组件未安装，可以根据需要添加：

- dialog（对话框）
- tooltip（工具提示）
- toast（通知）
- switch（开关）
- checkbox（复选框）
- radio（单选框）
- tabs（选项卡）
- table（表格）
- avatar（头像）
- progress（进度条）
- slider（滑块）
- calendar（日历）

要添加这些组件，运行：
```bash
npx shadcn@latest add [component-name]
```
