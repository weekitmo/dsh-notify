#!/bin/sh
set -eu

OWNER=weekitmo
REPO=dsh-notify
PROFILE=${DSH_NOTIFY_PROFILE:-web}
VERSION=${DSH_NOTIFY_VERSION:-}
LATEST_URL="https://github.com/${OWNER}/${REPO}/releases/latest"
REPOSITORY="git+https://github.com/${OWNER}/${REPO}.git"

fail() {
  printf 'dsh-notify installer: %s\n' "$*" >&2
  exit 1
}

install_dsh() {
  if command -v bun >/dev/null 2>&1; then
    INSTALL_COMMAND='bun add --global @deepseek-ai/dsh'
  elif command -v npm >/dev/null 2>&1; then
    INSTALL_COMMAND='npm install --global @deepseek-ai/dsh'
  else
    fail 'dsh is required; install DeepSeek Harness first.'
  fi

  if ! { exec 3<>/dev/tty; } 2>/dev/null; then
    fail 'dsh is required; install DeepSeek Harness first.'
  fi
  printf 'dsh is not installed. Install it now with `%s`? [y/N] ' "$INSTALL_COMMAND" >&3
  if ! IFS= read -r REPLY <&3 || [ "$REPLY" != y ]; then
    fail 'dsh is required; install DeepSeek Harness first.'
  fi
  exec 3>&-

  $INSTALL_COMMAND
  command -v dsh >/dev/null 2>&1 || fail 'dsh was installed but is not available in PATH. Open a new shell and try again.'
}

command -v dsh >/dev/null 2>&1 || install_dsh
command -v pnpm >/dev/null 2>&1 || fail 'pnpm is required because dsh plugin delegates installation to pnpm.'

resolve_latest() {
  if command -v curl >/dev/null 2>&1; then
    redirect=$(curl -fsSL --retry 3 --retry-delay 1 -o /dev/null -w '%{url_effective}' "$LATEST_URL")
    printf '%s\n' "${redirect##*/}"
  elif command -v wget >/dev/null 2>&1; then
    wget --server-response --spider "$LATEST_URL" 2>&1 \
      | sed -n 's|^[[:space:]]*[Ll]ocation: .*/tag/\([^[:space:]]*\).*|\1|p' \
      | tail -n 1
  else
    fail 'curl or wget is required to discover the latest release.'
  fi
}

if [ -z "$VERSION" ]; then
  VERSION=$(resolve_latest)
  [ -n "$VERSION" ] || fail 'could not determine the latest GitHub release tag.'
fi
case "$VERSION" in
  v*) TAG="$VERSION" ;;
  *) TAG="v$VERSION" ;;
esac
if ! printf '%s\n' "$TAG" | grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'; then
  fail "invalid SemVer tag: $VERSION"
fi

CORE=${TAG#v}
CORE=${CORE%%+*}
case "$CORE" in
  *-*)
    PRERELEASE=${CORE#*-}
    OLD_IFS=$IFS
    IFS=.
    set -- $PRERELEASE
    IFS=$OLD_IFS
    for IDENTIFIER do
      if printf '%s\n' "$IDENTIFIER" | grep -Eq '^[0-9]+$'; then
        case "$IDENTIFIER" in
          0[0-9]*) fail "invalid numeric prerelease identifier: $IDENTIFIER" ;;
        esac
      fi
    done
    ;;
esac

SPEC="${REPOSITORY}#${TAG}"
printf 'Installing dsh-notify %s into the %s profile...\n' "$TAG" "$PROFILE"
dsh plugin --profile "$PROFILE" add "$SPEC"
printf '\nInstalled dsh-notify %s. Refresh the DSH WebUI.\n' "$TAG"
printf 'Pinned install: dsh plugin --profile %s add %s\n' "$PROFILE" "$SPEC"
