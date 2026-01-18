# Changesets 自动版本与 Changelog 设计

## 目标

- 使用 Changesets 管理版本与 `CHANGELOG.md`
- 合并到 `main` 后自动生成版本、打 tag，并触发 npm 发布
- 保持发布流程简单、可追溯

## 方案概述

- 安装 `@changesets/cli` 并初始化 `.changeset` 配置
- 开发者在 PR 中添加 changeset 文件描述版本级别与变更内容
- `Release` workflow 在 `main` 上运行：
  - 执行 `changeset version` 生成 `CHANGELOG.md` 与版本更新
  - 提交版本变更并打 tag `vX.Y.Z`
  - 推送到 `main` 与 tag
- `Publish` workflow 继续监听 tag（`v*`）并发布到 npm

## 目录与配置

- `.changeset/config.json`：Changesets 配置
- `.changeset/README.md`：使用说明
- `package.json`：新增 changeset 脚本与 publishConfig
- `.github/workflows/release.yml`：自动 version + tag
- `.github/workflows/publish.yml`：tag 后发布

## 失败与回滚

- 若 `changeset version` 无变化，Release workflow 直接退出
- 如需回滚发布，按 npm 与 git tag 常规流程处理

## 测试与验证

- 合并含 changeset 的 PR 后观察 `Release` workflow 生成版本与 tag
- 确认 `Publish` workflow 由 tag 触发并发布到 npm

## 取舍

- 自动化程度高，减少手动版本管理
- Release workflow 会在 `main` 上产生额外提交
