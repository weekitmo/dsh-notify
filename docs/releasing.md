# 版本与发布

本文档面向项目维护者。

版本和 tag 遵循 [Semantic Versioning 2.0.0](https://semver.org/lang/zh-CN/)：

- `patch`：向后兼容的问题修复。
- `minor`：向后兼容的新功能。
- `major`：不兼容的 API 或行为变更。
- `prepatch` / `preminor` / `premajor` / `prerelease`：预发布版本，默认标识为 `rc`。

## 预览版本

先预览下一版本，不修改文件：

```sh
pnpm version:bump patch --dry-run
pnpm version:bump preminor --preid beta --dry-run
```

## 发布稳定版本

发布前先提交所有功能代码和最新 `lib/`，保持工作树干净，然后执行：

```sh
pnpm version:bump patch --tag --push
```

该命令会完成版本更新、检查、版本提交、annotated tag 和原子 push。

## 发布预发布版本

```sh
pnpm version:bump prepatch --preid rc --tag --push
```

也可以传入明确版本，例如 `pnpm version:bump 1.0.0 --tag --push`。

脚本会同步更新 [安装说明](installation.md) 中的固定 tag 和 `.tgz` 链接，并拒绝脏工作树、非法 SemVer 和重复 tag。tag push 后，`.github/workflows/release.yml` 会再次验证版本、执行 `pnpm run check`、确认 `lib/` 无差异、生成中文结构的 release log，并上传预构建 `.tgz`、`install.sh` 与 `SHA256SUMS`。

返回 [README](../README.md)。
