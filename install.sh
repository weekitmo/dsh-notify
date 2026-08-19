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

command -v dsh >/dev/null 2>&1 || fail 'dsh is required; install DeepSeek Harness first.'
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

SPEC="${REPOSITORY}#${TAG}"
printf 'Installing dsh-notify %s into the %s profile...\n' "$TAG" "$PROFILE"
dsh plugin --profile "$PROFILE" add "$SPEC"
printf '\nInstalled dsh-notify %s. Refresh the DSH WebUI.\n' "$TAG"
printf 'Pinned install: dsh plugin --profile %s add %s\n' "$PROFILE" "$SPEC"
