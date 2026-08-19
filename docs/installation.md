# 安装说明

README 中的一行命令适合安装最新稳定版。需要固定版本、校验发布资产或从源码安装时，请使用以下方式。

## 固定版本安装

当前版本：`v0.1.4`。

从 Git tag 安装：

```sh
dsh plugin --profile web add git+https://github.com/weekitmo/dsh-notify.git#v0.1.4
```

也可以安装 Release 中由 CI 产出的预构建包，不需要 git checkout：

```sh
dsh plugin --profile web add https://github.com/weekitmo/dsh-notify/releases/download/v0.1.4/dsh-notify-0.1.4.tgz
```

## SHA256SUMS

Release 同时发布 `SHA256SUMS`。安全或可复现安装建议先固定版本，下载并校验资产，再安装本地包：

```sh
mkdir dsh-notify-v0.1.4 && cd dsh-notify-v0.1.4
curl -fsSLO https://github.com/weekitmo/dsh-notify/releases/download/v0.1.4/install.sh
curl -fsSLO https://github.com/weekitmo/dsh-notify/releases/download/v0.1.4/dsh-notify-0.1.4.tgz
curl -fsSLO https://github.com/weekitmo/dsh-notify/releases/download/v0.1.4/SHA256SUMS
sha256sum -c SHA256SUMS        # Linux
# shasum -a 256 -c SHA256SUMS # macOS
dsh plugin --profile web add "$PWD/dsh-notify-0.1.4.tgz"
```

## 从源码安装

```sh
git clone --branch v0.1.4 --depth 1 https://github.com/weekitmo/dsh-notify.git
cd dsh-notify
corepack enable
pnpm install --frozen-lockfile
pnpm run check
dsh plugin --profile web add "file:$PWD"
```

DSH 不会为 `file:`、Git tag 或 GitHub 源码 archive 额外执行插件的 `build`。本仓库因此提交并发布 `lib/`；从源码安装时仍应运行 `pnpm run check`，确保构建产物与 `src/` 一致。

安装后刷新 WebUI。若插件没有自动加载，重启对应的 `dsh web` 进程后再刷新页面。

返回 [README](../README.md)。
