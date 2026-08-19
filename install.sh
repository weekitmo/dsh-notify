#!/bin/sh
set -eu

OWNER=weekitmo
REPO=dsh-notify
PROFILE=${DSH_NOTIFY_PROFILE:-web}
VERSION=${DSH_NOTIFY_VERSION:-}
API_URL="https://api.github.com/repos/${OWNER}/${REPO}/releases/latest"
REPOSITORY="git+https://github.com/${OWNER}/${REPO}.git"

fail() {
  printf 'dsh-notify installer: %s\n' "$*" >&2
  exit 1
}

command -v dsh >/dev/null 2>&1 || fail 'dsh is required; install DeepSeek Harness first.'
command -v pnpm >/dev/null 2>&1 || fail 'pnpm is required because dsh plugin delegates installation to pnpm.'

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 --retry-delay 1 -H 'Accept: application/vnd.github+json' -H 'User-Agent: dsh-notify-installer' "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    fail 'curl or wget is required to discover the latest release.'
  fi
}

if [ -z "$VERSION" ]; then
  VERSION=$(fetch "$API_URL" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"[:space:]]*\)".*/\1/p' | head -n 1)
  [ -n "$VERSION" ] || fail 'could not determine the latest GitHub release tag.'
fi
case "$VERSION" in
  v*) TAG="$VERSION" ;;
  *) TAG="v$VERSION" ;;
esac
if ! printf '%s\n' "$TAG" | grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'; then
  fail "invalid SemVer tag: $VERSION"
fi

SPEC="${REPOSITORY}#${TAG}"
printf 'Installing dsh-notify %s into the %s profile...\n' "$TAG" "$PROFILE"
dsh plugin --profile "$PROFILE" add "$SPEC"
printf '\nInstalled dsh-notify %s. Refresh the DSH WebUI.\n' "$TAG"
printf 'Pinned install: dsh plugin --profile %s add %s\n' "$PROFILE" "$SPEC"
