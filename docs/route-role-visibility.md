# 路由与用户角色可见性对照表

> 生成日期：2026-01-13
> 说明：依据当前路由与页面鉴权逻辑整理；如页面本身未做角色校验，但位于受保护布局中，则标记为“登录可见”。

## 角色说明
- **admin** 管理员
- **product_manager** 产品经理
- **developer** 开发者
- **customer_support** 客服
- **customer** 终端用户

## 路由对照

| 路由 | 页面/功能 | 访问要求 | 角色可见性 | 备注 |
|---|---|---|---|---|
| `/` | 落地页 | 公开 | 所有人 | - |
| `/login` | 登录页 | 公开 | 所有人 | 已登录会重定向 `/dashboard` |
| `/register` | 注册页 | 公开 | 所有人 | 已登录会重定向 `/dashboard` |
| `/docs` | API 文档 | 公开 | 所有人 | Swagger UI |
| `/feedback/[id]` | 公开反馈详情 | 公开 | 所有人 | 登录后可用账号评论；游客可匿名评论 |
| `/widget/[organizationId]` | 嵌入式反馈 Widget | 公开 | 所有人 | 供产品内嵌使用 |
| `/<organizationSlug>` | 公开反馈 Portal | 公开 | 所有人 | 入口默认展示反馈 |
| `/invite/[token]` | 邀请接受 | 公开 | 所有人 | 未登录会提示登录 |

| `/dashboard` | 仪表盘 | 登录 | 所有登录用户 | 由 Dashboard 布局保护 |
| `/feedback` | 反馈管理列表 | 登录 | 所有登录用户 | 列表内可投票 |
| `/feedback/new` | 代客户提交反馈 | 登录 | admin、product_manager、customer_support | 其他角色显示“权限不足” |
| `/admin/feedback/[id]` | 后台反馈详情 | 登录 | 所有登录用户 | 编辑/删除/状态更新权限依角色而定 |

| `/settings/notifications` | 通知设置 | 登录 | 所有登录用户 | - |
| `/settings/organizations/new` | 创建组织 | 登录 | 所有登录用户 | 侧边栏入口仅管理员可见 |
| `/settings/organizations/[orgId]/members` | 成员管理 | 登录 | 所有登录用户 | 仅管理员可调整角色/移除成员 |
| `/settings/organization` | 组织管理 | 登录 | admin | 组织信息与成员管理 |
| `/settings/portal-branding` | Portal Branding | 登录 | admin、product_manager | 主题、文案、语言 |
| `/settings/portal-growth` | Portal Growth | 登录 | admin、product_manager | 分享与 SEO |
| `/settings/portal-access` | Portal Access | 登录 | admin、product_manager | 可见性与权限 |
| `/settings/portal-modules` | Portal Modules | 登录 | admin、product_manager | 模块开关 |
| `/settings/portal-resources` | Portal Resources | 登录 | admin、product_manager | 入口与预览链接 |

## 权限细节（页面内行为）

| 功能 | 约束 | 说明 |
|---|---|---|
| 代客户提交 | `canSubmitOnBehalf` | 允许角色：admin、product_manager、customer_support |
| 更新反馈状态 | `canUpdateFeedbackStatus` | 允许角色：admin、product_manager |
| 删除反馈 | `canDeleteFeedback` | 允许角色：admin |
| 组织角色管理/移除成员 | 管理员限定 | 在成员管理页内限制 |

## 已知不一致/注意事项
- 登录跳转存在 `/login` 与 `/sign-in` 混用（如 `app/(dashboard)/feedback/page.tsx`），可能导致重定向不一致。
