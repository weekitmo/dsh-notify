# dsh-notify

[English](README_EN.md) | 简体中文

[![CI](https://github.com/weekitmo/dsh-notify/actions/workflows/ci.yml/badge.svg)](https://github.com/weekitmo/dsh-notify/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/v/release/weekitmo/dsh-notify)](https://github.com/weekitmo/dsh-notify/releases/latest) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

DeepSeek Harness 的任务状态通知插件。它在任务运行、完成或异常时，通过系统通知、浏览器 Tab 标题和左侧会话列表提供明确的状态提示。

## 功能

- **系统通知**：完成、错误、中止、阻塞、Token 限制均可通知；可在设置中单独关闭某一类。
- **钉钉机器人**：配置 Access Token 与 Signing Secret，独立选择“成功 / 完成”或“失败 / 中止”消息，并支持免打扰和结束后错过消息汇总。
- **Tab 状态**：空闲时显示最近工作区会话标题；运行中显示 spinner 和会话数；完成或异常后显示未读结果计数。
- **侧栏状态灯**：会话完成且尚未查看时显示绿色圆点；错误、中止、阻塞或 Token 限制显示红色圆点。打开会话后清除。
- **状态兼容**：执行中的会话保留 DSH 自带 loading，等待审批或回答时保留原生警告状态。
- **可配置**：可在 WebUI 的 **设置 > 通知** 中控制通知权限、Tab 动效、favicon、spinner、侧栏状态灯和结果类型。

## 安装

前置条件：`pnpm` 在 `PATH` 中。若未安装 `dsh`，安装器会优先使用 `bun`、其次使用 `npm` 提示安装；只有输入小写 `y` 才会执行。

### 一行安装最新稳定版

macOS、Linux 或其他 POSIX shell 使用 curl：

```sh
curl -fsSL https://github.com/weekitmo/dsh-notify/releases/latest/download/install.sh | sh
```

或使用 wget：

```sh
wget -qO- https://github.com/weekitmo/dsh-notify/releases/latest/download/install.sh | sh
```

Windows CMD 克隆仓库后运行批处理安装器；系统询问是否允许执行时请确认：

```bat
git clone --depth 1 https://github.com/weekitmo/dsh-notify.git
cd dsh-notify
install.bat
```

安装后刷新 WebUI。若插件没有自动加载，重启对应的 `dsh web` 进程后再刷新页面。

固定版本、校验和与源码安装方式见 [安装说明](docs/installation.md)。

## 启用与使用

1. 打开 WebUI 的 **设置 > 通知**。
2. 开启需要的通知功能。
3. 如需系统通知，点击 **请求授权**，并在浏览器提示中允许通知。
4. 如需钉钉通知，在钉钉配置组打开官方文档创建自定义机器人，填写 Access Token 与 Signing Secret，选择需要发送的结果类型后保存。
5. 保持默认配置，或分别调整 Tab 提示、运行中 spinner、侧栏状态灯及结果类型。

钉钉的结果筛选独立于浏览器通知开关。关闭系统通知或本地某类结果，不会关闭已启用的钉钉分类。浏览器通知权限被拒后，网页无法再次强制弹出授权框；请从浏览器地址栏的站点权限设置中重新允许通知。

## 配置

浏览器侧设置保存在当前站点的 `localStorage`，默认配置如下：

| 设置 | 默认 |
| --- | --- |
| 系统通知 | 开 |
| Tab 未读结果汇总 | 开 |
| Tab 运行中 spinner | 开 |
| Tab 空闲标题动效 | 开 |
| 空闲 hidden favicon 提示 | 关 |
| 侧栏绿/红状态灯 | 开 |
| 五类结束结果 | 全开 |
| 未读结果动画 | 跑马灯 |
| 钉钉成功 / 完成消息 | 开（配置凭据后生效） |
| 钉钉失败 / 中止消息 | 开（包含错误、阻塞、Token 限制） |
| 钉钉消息免打扰 | 关（默认时段 23:00-08:00） |
| 免打扰结束后错过消息汇总 | 关 |

钉钉凭据与策略保存在 `$DSH_HOME/dsh-notify/settings.json`，不会写入浏览器 `localStorage`，API 也不会把凭据回传给页面。凭据管理接口仅接受本机回环地址上的同源 WebUI 请求；通过局域网或公网地址访问 WebUI 时不能修改钉钉配置。免打扰固定按 `Asia/Shanghai` 判断，支持跨午夜；开启汇总后，期间消息会暂存到同目录的 `dingtalk-missed.json`，结束时合并为一条通知。普通任务结果也会在发送前短暂写入该持久队列，失败或重启后自动重试；交付采用 at-least-once 语义，极端崩溃窗口可能重复，但不会静默丢失。更换机器人凭据会在保存新凭据前清空旧队列，关闭结果分类也会移除对应待发消息。POSIX 系统使用 `0700` 目录和 `0600` 文件权限；Windows 依赖当前用户的文件 ACL，并继续拒绝符号链接和非普通文件。

Host 侧可配置最近回复摘要的最大长度。在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中添加或覆盖：

```yaml
- id: dsh-notify
  name: dsh-notify
  config:
    maxBodyChars: 400
```

## 卸载

```sh
dsh plugin --profile web remove dsh-notify
```

刷新页面；若插件仍然存在，重启对应的 `dsh web` 进程。

## 相关文档

- [安装说明](docs/installation.md)：固定版本、SHA256 校验和源码安装。
- [开发说明](docs/development.md)：已知限制、本地开发和检查命令。
- [版本与发布](docs/releasing.md)：版本规范与维护者发布流程。

## License

MIT. See [LICENSE](LICENSE).
