# 开发说明

## 已知限制

- 系统通知需要浏览器页面保持打开，并受浏览器与操作系统通知权限共同控制。
- 当前 DSH 没有公开的 session-row adornment slot；侧栏状态灯会在结构不匹配或存在同名会话时安全跳过，不会猜测目标会话。
- `document.title` 只能使用文本动画，因此运行中提示使用 Unicode spinner，而不是 CSS 圆环。

## 本地开发

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm pack
```

`pnpm run check` 会执行类型检查、测试、构建和发布脚本自检。发布前必须提交 `lib/` 构建产物；远程安装直接消费这些文件，DSH 不会自动构建插件。

版本维护流程见 [版本与发布](releasing.md)。返回 [README](../README.md)。
