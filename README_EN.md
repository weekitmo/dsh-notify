# dsh-notify

English | [简体中文](README.md)

[![CI](https://github.com/weekitmo/dsh-notify/actions/workflows/ci.yml/badge.svg)](https://github.com/weekitmo/dsh-notify/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/v/release/weekitmo/dsh-notify)](https://github.com/weekitmo/dsh-notify/releases/latest) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A task status notification plugin for DeepSeek Harness. It provides clear status updates through system notifications, the browser tab title, and the session list when a task is running, completed, or interrupted by an error.

## Features

- **System notifications**: Receive notifications for completed, failed, aborted, blocked, and token-limited tasks. Each result type can be disabled separately.
- **Tab status**: Shows the latest workspace session title while idle, a spinner and session count while running, and an unread result count after completion or failure.
- **Sidebar indicators**: Shows a green dot for an unread completed session and a red dot for an error, abort, block, or token limit. Opening the session clears the indicator.
- **Native state compatibility**: Active sessions keep the built-in DSH loading state, while approval and question prompts keep their native warning state.
- **Configurable behavior**: Control notification permissions, tab animation, favicon, spinner, sidebar indicators, and result types under **Settings > Notifications** in the WebUI.

## Installation

Prerequisite: `pnpm` is available in `PATH`. If `dsh` is missing, the installer prompts to install it with `bun` when available, then falls back to `npm`; installation runs only after entering a lowercase `y`.

### Install the Latest Stable Release

On macOS, Linux, or another POSIX shell, use curl:

```sh
curl -fsSL https://github.com/weekitmo/dsh-notify/releases/latest/download/install.sh | sh
```

Or use wget:

```sh
wget -qO- https://github.com/weekitmo/dsh-notify/releases/latest/download/install.sh | sh
```

From Windows CMD, clone the repository and run the batch installer. Confirm execution if Windows asks for permission:

```bat
git clone --depth 1 https://github.com/weekitmo/dsh-notify.git
cd dsh-notify
install.bat
```

Refresh the WebUI after installation. If the plugin does not load automatically, restart the corresponding `dsh web` process and refresh the page again.

For pinned versions, checksum verification, and source installation, see the [installation guide](docs/installation.md).

## Enable and Use

1. Open **Settings > Notifications** in the WebUI.
2. Enable the notification features you need.
3. For system notifications, click **Request permission** and allow notifications in the browser prompt.
4. Keep the defaults or adjust tab indicators, the running spinner, sidebar indicators, and result types.

After browser notification permission has been denied, the page cannot force the permission prompt to appear again. Re-enable notifications in the site's permission settings from the browser address bar.

## Configuration

Browser settings are stored in `localStorage` for the current site. The defaults are:

| Setting | Default |
| --- | --- |
| System notifications | On |
| Unread result summary in the tab | On |
| Running spinner in the tab | On |
| Idle tab title animation | On |
| Hidden-page idle favicon indicator | Off |
| Green/red sidebar indicators | On |
| All five result types | On |
| Unread result animation | Marquee |

The host-side maximum length of the latest response summary can be configured in `$DSH_HOME/profiles/web/cordis.patch.yml`:

```yaml
- id: dsh-notify
  name: dsh-notify
  config:
    maxBodyChars: 400
```

## Uninstall

```sh
dsh plugin --profile web remove dsh-notify
```

Refresh the page. If the plugin is still present, restart the corresponding `dsh web` process.

## Additional Documentation

- [Installation guide](docs/installation.md): Pinned versions, SHA256 checksums, and source installation.
- [Development guide](docs/development.md): Known limitations, local development, and validation commands.
- [Versioning and releases](docs/releasing.md): Versioning rules and the maintainer release process.

## License

MIT. See [LICENSE](LICENSE).
