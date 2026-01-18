# 用户注册设计说明

**日期:** 2026-01-02
**范围:** Story 4.1 用户注册（认证域 + 业务域）

## 目标
为新用户提供注册入口，完成账号创建、默认组织创建与自动登录，并保持认证域与业务域解耦。

## 架构与边界
- **认证域（better-auth）**：用户/会话等授权表由 better-auth 的 Drizzle schema 提供与维护。
- **业务域（自有表）**：组织与组织成员表独立维护；新增 `user_profiles` 保存姓名等扩展信息。
- **迁移策略**：统一通过 drizzle-kit 生成并运行迁移（不手写 SQL）。

## 数据模型
- `auth_*`（better-auth 提供）：用户、会话等表结构由其 Drizzle schema 生成。
- `user_profiles`
  - `userId` 外键指向认证域用户表
  - `name`（必填）及未来可扩展字段
- `organizations`
  - `name`, `slug`
- `organization_members`
  - `organizationId`, `userId`, `role`（注册时为 `admin`）

## 注册流程
1. 客户端提交姓名/邮箱/密码到 `POST /api/auth/register`。
2. 服务端使用 Zod 校验（邮箱格式/密码强度/姓名）。
3. 调用 better-auth 注册接口创建用户并建立会话。
4. 同一事务内创建 `user_profiles`、默认组织与成员关系。
5. 成功返回 201，前端跳转 `/dashboard`。

## 错误处理
- 校验失败：400 + 字段级错误。
- 邮箱已存在：409。
- 其他错误：500（通用错误提示）。

## 前端
- 页面：`app/(auth)/register/page.tsx`
- 表单组件：`components/auth/register-form.tsx`
- 客户端校验 + 服务端再次校验
- 成功后提示 toast 并跳转仪表板

## 测试范围
- API：成功注册、邮箱重复、弱密码/无效邮箱。
- 验证创建了 profile、组织与成员关系。

## 待确认
- better-auth Drizzle schema 的具体导出与命名（需以官方文档为准）。
