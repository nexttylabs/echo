# 多语言支持（i18n）检查报告

## 检查日期
2026-01-17

## 项目概况
- **项目名称**: Echo
- **技术栈**: Next.js 16.1.1 + React 19 + TypeScript
- **国际化方案**: next-intl
- **支持语言**: en, zh-CN, jp

## 配置检查 ✅

### 1. i18n 配置文件
- `/i18n/config.ts` - 完整配置，包含默认语言、支持的语言列表等
- `/i18n/request.ts` - next-intl 请求配置
- `/i18n/resolve-locale.ts` - 语言解析逻辑

### 2. 语言文件
- `/messages/en.json` - 英文翻译（498行）
- `/messages/zh-CN.json` - 中文翻译（491行）
- `/messages/jp.json` - 日文翻译

## 组件检查结果

### 已实现 i18n 的组件（27个）
✅ 使用了 `useTranslations` 或 `getTranslations` 的组件：
- `/components/dashboard/stats-cards.tsx`
- `/components/shared/pagination.tsx`
- `/components/feedback/vote-button.tsx`
- `/components/integrations/github-config.tsx`
- `/components/dashboard/status-chart.tsx`
- `/components/feedback/feedback-detail-view.tsx`
- `/components/feedback/feedback-filters.tsx`
- `/components/feedback/feedback-list-item.tsx`
- `/components/feedback/feedback-bulk-actions.tsx`
- `/components/dashboard/recent-feedback-list.tsx`
- `/components/feedback/feedback-list-controls.tsx`
- `/components/feedback/feedback-edit-form.tsx`
- `/components/feedback/auto-classification-badge.tsx`
- `/components/feedback/feedback-list.tsx`
- `/components/feedback/processing-status.tsx`
- `/components/layout/sidebar.tsx`
- `/components/layout/language-switcher.tsx`
- `/components/layout/mobile-sidebar.tsx`
- `/components/auth/register-form.tsx`
- `/components/auth/login-form.tsx`
- `/components/widget/widget-form.tsx`
- `/components/portal/contributors-sidebar.tsx`
- `/components/settings/notification-preferences.tsx`
- `/components/settings/settings-sidebar.tsx`
- `/components/settings/profile-form.tsx`
- `/components/settings/appearance-form.tsx`
- `/components/settings/api-keys-list.tsx`

### ❌ 未实现 i18n 的组件（59个）

#### 1. 包含硬编码中文文本的组件

**`/components/landing/hero.tsx`**
- 硬编码文本："开源产品反馈管理平台"、"专为初创公司设计"等
- 导航链接："登录"、"免费注册"等

**`/components/dashboard/quick-actions.tsx`**
- 硬编码文本："提交新反馈"、"查看全部反馈"、"设置"、"组织设置"

**`/components/feedback/embedded-feedback-form.tsx`**
- 导出的常量包含中文：
  ```typescript
  export const FEEDBACK_TRIGGER_LABEL = "反馈";
  export const FEEDBACK_DIALOG_TITLE = "提交反馈";
  export const FEEDBACK_TITLE_LABEL = "标题";
  // ... 更多
  ```

**`/components/portal/portal-modules-panel.tsx`**
- 硬编码文本："Portal 模块开关"、"控制门户中展示的功能模块"、"反馈"、"允许用户提交和浏览反馈"等

**`/components/portal/settings-forms/copy-form.tsx`**
- 默认值包含中文：
  ```typescript
  title: initialData?.title ?? "反馈中心",
  ctaLabel: initialData?.ctaLabel ?? "提交反馈",
  // ... 更多
  ```

**`/components/settings/organization-form.tsx`**
- 硬编码文本："组织设置"、"创建新组织"

**`/components/feedback/submit-on-behalf-form.tsx`**
- 硬编码文本："提交中..."、"提交反馈"

**`/components/feedback/file-upload.tsx`**
- 硬编码文本："请先提交反馈"

#### 2. 示例和演示组件
- `/components/component-example.tsx` - 包含大量硬编码英文文本
- `/components/example.tsx` - 基础组件，无显示文本

#### 3. 其他需要检查的组件
- `/components/api-keys/api-key-manager.tsx`
- `/components/comment/` 目录下的所有组件
- `/components/dashboard/organization-switcher.tsx`
- `/components/feedback/` 目录下的大部分组件
- `/components/integrations/` 目录下的组件
- `/components/portal/` 目录下的组件
- `/components/widget/` 目录下的组件

## 页面检查结果

### 已实现 i18n 的页面（67个）
✅ 使用了 `useTranslations` 或 `getTranslations` 的页面已正确实现

### ❌ 需要检查的页面（35个）

#### 1. 公共页面
- `/app/(public)/page.tsx` - 仅引用 Hero 组件
- `/app/(public)/docs/page.tsx` - API 文档页面，包含硬编码文本

#### 2. 认证页面
- `/app/(auth)/login/page.tsx`
- `/app/(auth)/register/page.tsx`
- `/app/(auth)/sign-in/page.tsx`

#### 3. 设置页面
- `/app/(dashboard)/settings/` 目录下的多个子页面

## 建议修复方案

### 1. 立即修复（高优先级）

#### `/components/landing/hero.tsx`
```typescript
// 添加导入
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("hero");
  
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-8 text-primary" />
          <span className="text-2xl font-bold text-slate-900">{t("title")}</span>
        </div>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher variant="icon" />
          <Button variant="ghost" asChild>
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{t("register")}</Link>
          </Button>
        </nav>
      </header>
      // ... 更多
    </div>
  );
}
```

需要在语言文件中添加：
```json
{
  "hero": {
    "title": "Echo",
    "login": "登录",
    "register": "免费注册",
    "headline": "开源产品反馈管理平台",
    "description": "专为初创公司设计，让团队能够集中管理产品反馈、发现洞察并做出明智的产品决策。",
    "cta1": "开始使用",
    "cta2": "查看文档",
    "coreValues": "核心价值"
  }
}
```

#### `/components/dashboard/quick-actions.tsx`
```typescript
import { useTranslations } from "next-intl";

export function QuickActions() {
  const t = useTranslations("dashboard.quickActions");
  
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/admin/feedback/new">
          <Plus className="mr-2 h-4 w-4" />
          {t("submitFeedback")}
        </Link>
      </Button>
      // ... 更多
    </div>
  );
}
```

### 2. 中期修复（中优先级）

1. **所有 feedback 相关组件**
   - 将导出的常量改为使用 useTranslations
   - 创建统一的翻译键命名空间

2. **所有 portal 相关组件**
   - 为门户设置创建专门的翻译节
   - 确保所有用户可见文本都支持多语言

3. **所有 settings 相关组件**
   - 统一设置页面的翻译键结构
   - 注意表单标签和提示信息

### 3. 长期优化（低优先级）

1. **创建翻译键命名规范**
   - 建议使用点分隔的命名空间：`section.component.field`
   - 避免过深的嵌套

2. **建立翻译检查流程**
   - 在 CI/CD 中添加翻译完整性检查
   - 确保新增的文本都包含翻译

3. **优化翻译文件结构**
   - 考虑按功能模块拆分翻译文件
   - 减少单个文件的复杂度

## 缺失的翻译键示例

基于检查结果，以下是一些需要添加的翻译键：

```json
{
  "hero": { ... },
  "dashboard": {
    "quickActions": {
      "submitFeedback": "提交新反馈",
      "viewAllFeedback": "查看全部反馈",
      "settings": "设置",
      "organizationSettings": "组织设置"
    }
  },
  "feedback": {
    "trigger": "反馈",
    "dialogTitle": "提交反馈",
    "title": "标题",
    "description": "描述",
    "type": "反馈类型",
    "priority": "优先级",
    "submit": "提交",
    "cancel": "取消",
    "success": "反馈提交成功",
    "trackingLink": "跟踪链接"
  },
  "portal": {
    "modules": {
      "title": "Portal 模块开关",
      "description": "控制门户中展示的功能模块",
      "feedback": "反馈",
      "feedbackDescription": "允许用户提交和浏览反馈",
      "roadmap": "路线图",
      "roadmapDescription": "展示产品开发计划和进度",
      "changelog": "更新日志",
      "changelogDescription": "发布产品更新和改进说明"
    },
    "copy": {
      "title": "反馈中心",
      "ctaLabel": "提交反馈",
      "emptyState": "还没有反馈，成为第一个分享想法的人！",
      "success": "感谢您的反馈！我们会认真阅读。"
    }
  },
  "settings": {
    "organization": {
      "title": "组织设置",
      "create": "创建新组织"
    }
  }
}
```

## 总结

- ✅ **已完成**: 27个组件和67个页面已正确实现 i18n
- ❌ **需要修复**: 59个组件和35个页面需要添加 i18n 支持
- 📊 **完成度**: 约 55%

**建议优先级**：
1. 先修复包含硬编码中文的组件（高优先级）
2. 再修复其他用户可见的组件（中优先级）
3. 最后优化和规范化（低优先级）

**注意事项**：
- 修复时确保所有三种语言（en、zh-CN、jp）都有对应翻译
- 测试语言切换功能是否正常工作
- 注意动态内容（如日期、数字）的本地化
