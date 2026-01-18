# 项目删除功能设计

**日期**: 2026-01-09  
**状态**: 已批准

## 概述

为项目管理功能添加删除能力，允许管理员安全地删除项目。使用输入项目名称确认的方式防止误删除。

## 需求

- 只有管理员（admin）可以删除项目
- 删除前必须输入完整项目名称进行确认
- 删除成功后跳转到项目列表页面
- 删除是永久性的，会级联删除所有相关数据（通过数据库外键 onDelete: cascade）
- 显示警告信息，告知用户删除的后果

## 技术实现

### 1. 后端 API

**已存在**: `/api/projects/[projectId]` DELETE 端点
- 权限检查：仅限 admin 角色
- 数据库删除：使用 Drizzle ORM 删除项目记录
- 级联删除：通过数据库外键自动处理（projects.organizationId 引用 organizations.id，设置了 onDelete: cascade）

### 2. 前端组件

#### 2.1 删除按钮区域（ProjectSettings 组件）

**位置**: `components/project/project-settings.tsx`

在现有的 Widget 配置卡片下方添加新的"危险区域"卡片：

```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle className="text-destructive">危险区域</CardTitle>
    <CardDescription>
      这些操作不可逆，请谨慎操作
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-medium">删除项目</h4>
        <p className="text-sm text-muted-foreground">
          永久删除此项目及其所有相关数据
        </p>
      </div>
      <Button variant="destructive" onClick={openDeleteDialog}>
        删除项目
      </Button>
    </div>
  </CardContent>
</Card>
```

#### 2.2 删除确认对话框组件

**新建组件**: `components/project/delete-project-dialog.tsx`

**功能要求**:
- 使用 shadcn Dialog 组件
- 显示警告图标和警告文本
- 包含输入框，要求用户输入完整项目名称
- 实时验证输入内容
- 只有输入完全匹配时才启用删除按钮
- 显示加载状态（删除进行中）
- 删除成功后跳转到 `/settings/projects`

**对话框内容**:
```
标题: 删除项目
图标: AlertTriangle（红色）

警告文本:
此操作不可撤销。删除项目将会：
• 永久删除项目的所有配置
• 删除所有相关的反馈数据
• 删除所有相关的评论和附件

输入框:
请输入项目名称 "{projectName}" 以确认删除

按钮:
- 取消（outline variant）
- 删除项目（destructive variant，仅在输入正确时可用）
```

### 3. 状态管理和错误处理

**状态**:
- `isOpen`: 对话框是否打开
- `isDeleting`: 是否正在删除
- `confirmText`: 用户输入的确认文本
- `error`: 删除错误信息

**错误处理**:
- 网络错误：显示错误提示，不关闭对话框
- 权限错误：显示"权限不足"错误
- 项目不存在：显示"项目未找到"错误

### 4. 用户流程

1. 用户在项目设置页面向下滚动到"危险区域"
2. 点击"删除项目"按钮
3. 弹出确认对话框
4. 查看警告信息
5. 输入完整项目名称
6. 点击"删除项目"按钮（此时已启用）
7. 显示加载状态
8. 删除成功后自动跳转到 `/settings/projects`
9. 显示成功提示（toast）

## UI/UX 设计

### 视觉层次
- 危险区域使用浅红色边框突出显示
- 删除按钮使用 destructive variant（红色背景）
- 对话框中的警告图标使用红色
- 确认输入框下方显示灰色提示文本

### 可访问性
- 对话框支持键盘导航（ESC 关闭，Tab 切换）
- 表单提交使用 Enter 键（输入正确时）
- 使用 ARIA 标签标记警告区域
- 输入框有明确的 label 和 placeholder

## 文件清单

### 新建文件
- `components/project/delete-project-dialog.tsx` - 删除确认对话框组件

### 修改文件
- `components/project/project-settings.tsx` - 添加危险区域和删除按钮

### 依赖组件（已存在）
- `components/ui/dialog.tsx` - shadcn Dialog 组件
- `components/ui/button.tsx` - shadcn Button 组件
- `components/ui/card.tsx` - shadcn Card 组件
- `components/ui/input.tsx` - shadcn Input 组件

## 安全考虑

1. **权限控制**: 后端 API 已实现，仅 admin 可删除
2. **确认机制**: 必须输入完整项目名称，防止误操作
3. **不可逆警告**: 明确告知用户删除后果
4. **级联删除**: 数据库层面自动处理，避免孤立数据

## 测试要点

1. **权限测试**: 非 admin 用户不应看到删除按钮
2. **输入验证**: 只有完全匹配才能启用删除按钮
3. **删除成功**: 项目被删除并跳转到列表页
4. **错误处理**: 网络错误、权限错误等正确显示
5. **级联删除**: 相关数据正确删除（需数据库层面验证）

## 未来优化

1. 软删除：考虑添加 deletedAt 字段实现软删除
2. 删除前统计：显示将被删除的反馈数量
3. 导出备份：删除前允许导出项目数据
