@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "OWNER=weekitmo"
set "REPO=dsh-notify"
if defined DSH_NOTIFY_PROFILE (set "PROFILE=%DSH_NOTIFY_PROFILE%") else set "PROFILE=web"
if defined DSH_NOTIFY_VERSION (set "VERSION=%DSH_NOTIFY_VERSION%") else set "VERSION="
set "LATEST_URL=https://github.com/%OWNER%/%REPO%/releases/latest"
set "REPOSITORY=git+https://github.com/%OWNER%/%REPO%.git"

where dsh >nul 2>&1
if errorlevel 1 call :install_dsh
if errorlevel 1 exit /b 1
where pnpm >nul 2>&1
if errorlevel 1 call :fail "pnpm is required because dsh plugin delegates installation to pnpm."
if errorlevel 1 exit /b 1

if not defined VERSION call :resolve_latest
if errorlevel 1 exit /b 1
if not defined VERSION call :fail "could not determine the latest GitHub release tag."
if errorlevel 1 exit /b 1

if /i "%VERSION:~0,1%"=="v" (set "TAG=%VERSION%") else set "TAG=v%VERSION%"
set "DSH_NOTIFY_TAG=%TAG%"
powershell.exe -NoProfile -NonInteractive -Command "$tag=$env:DSH_NOTIFY_TAG; if ($tag -notmatch '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$') { exit 1 }; $core=($tag.Substring(1) -split '\+')[0]; if ($core.Contains('-')) { foreach ($id in ($core.Substring($core.IndexOf('-') + 1) -split '\.')) { if ($id -match '^[0-9]+$' -and $id.Length -gt 1 -and $id.StartsWith('0')) { exit 1 } } }" >nul 2>&1
if errorlevel 1 call :fail "invalid SemVer tag: %VERSION%"
if errorlevel 1 exit /b 1

set "SPEC=%REPOSITORY%#%TAG%"
echo Installing dsh-notify %TAG% into the %PROFILE% profile...
dsh plugin --profile "%PROFILE%" add "%SPEC%"
if errorlevel 1 exit /b 1
echo.
echo Installed dsh-notify %TAG%. Refresh the DSH WebUI.
echo Pinned install: dsh plugin --profile %PROFILE% add %SPEC%
exit /b 0

:install_dsh
where bun >nul 2>&1
if not errorlevel 1 (
  set "INSTALLER=bun"
  set "INSTALL_COMMAND=bun add --global @deepseek-ai/dsh"
) else (
  where npm >nul 2>&1
  if errorlevel 1 (
    call :fail "dsh is required; install DeepSeek Harness first."
    exit /b 1
  )
  set "INSTALLER=npm"
  set "INSTALL_COMMAND=npm install --global @deepseek-ai/dsh"
)
set "REPLY="
set /p "REPLY=dsh is not installed. Install it now with '%INSTALL_COMMAND%'? [y/N] "
set REPLY 2>nul | %SystemRoot%\System32\findstr.exe /x /c:"REPLY=y" >nul
if errorlevel 1 call :fail "dsh is required; install DeepSeek Harness first."
if errorlevel 1 exit /b 1
if "%INSTALLER%"=="bun" (
  bun add --global @deepseek-ai/dsh
) else (
  npm install --global @deepseek-ai/dsh
)
if errorlevel 1 exit /b 1
where dsh >nul 2>&1
if errorlevel 1 call :fail "dsh was installed but is not available in PATH. Open a new terminal and try again."
if errorlevel 1 exit /b 1
exit /b 0

:resolve_latest
where powershell.exe >nul 2>&1
if errorlevel 1 call :fail "PowerShell is required to discover the latest release."
if errorlevel 1 exit /b 1
set "DSH_NOTIFY_LATEST_URL=%LATEST_URL%"
for /f "usebackq delims=" %%V in (`powershell.exe -NoProfile -NonInteractive -Command "$response=Invoke-WebRequest -UseBasicParsing -Uri $env:DSH_NOTIFY_LATEST_URL; $uri=$response.BaseResponse.ResponseUri; if (-not $uri) { $uri=$response.BaseResponse.RequestMessage.RequestUri }; $uri.AbsolutePath.TrimEnd('/').Split('/')[-1]"`) do set "VERSION=%%V"
if not defined VERSION call :fail "could not determine the latest GitHub release tag."
if errorlevel 1 exit /b 1
exit /b 0

:fail
echo dsh-notify installer: %~1 1>&2
exit /b 1
