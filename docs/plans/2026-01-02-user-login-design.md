# 用户登录设计说明

**日期:** 2026-01-02
**范围:** Story 4.2 用户登录（认证域）

## 目标
为已注册用户提供登录入口，使用 better-auth 内置凭据登录能力建立会话，并在已登录状态下自动重定向至仪表板。

## 架构与边界
- **认证域（better-auth）**：登录、会话与 Cookie 由 better-auth 内置端点处理。
- **业务域**：登录成功后仅负责前端跳转与展示，不参与会话生成。

## 登录流程
1. 访问 `/login` 时，服务端调用 `auth.api.getSession`，若已有会话则重定向 `/dashboard`。
2. 前端表单提交至 `/api/auth/sign-in/email`，携带 `email`、`password`、`rememberMe`。
3. better-auth 验证凭据并建立会话，设置 HTTP-only Cookie。
4. 前端收到成功响应后跳转 `/dashboard`。

## 记住我
- 表单提供“记住我”选项，勾选时发送 `rememberMe: true`。
- 会话有效期目标为 30 天；如需显式配置，按 better-auth 配置项调整。

## 错误处理
- 登录失败统一提示“邮箱或密码错误”，避免泄露账号存在性。
- 客户端仅做基础校验（必填、邮箱格式），服务端由 better-auth 处理最终校验。

## 前端
- 页面：`app/(auth)/login/page.tsx`
- 表单组件：`components/auth/login-form.tsx`
- 交互：提交中禁用按钮，失败提示通用错误；成功跳转仪表板。

## 测试范围
- UI：成功登录后跳转；错误登录显示通用错误提示。
- 登录页访问：已登录用户自动重定向。

## 待确认
- better-auth 对 `rememberMe` 的默认会话时长与显式配置项。
