#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import semver from 'semver'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packagePath = join(root, 'package.json')
const readmePath = join(root, 'README.md')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
const args = process.argv.slice(2)
const modes = new Set(['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'])

let mode = null
let preid = 'rc'
let dryRun = false
let createTag = false
let push = false

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index]
  if (argument === '--') continue
  if (argument === '--dry-run') dryRun = true
  else if (argument === '--tag') createTag = true
  else if (argument === '--push') push = true
  else if (argument === '--preid') preid = args[++index]
  else if (argument.startsWith('--preid=')) preid = argument.slice('--preid='.length)
  else if (argument.startsWith('--')) fail('Unknown option: ' + argument)
  else if (mode) fail('Only one bump mode or explicit version is allowed')
  else mode = argument
}

if (!mode) fail('Missing bump mode or explicit version')
if (!preid || !/^[0-9A-Za-z-]+$/.test(preid)) fail('--preid must be a valid SemVer identifier')
if (push && !createTag) fail('--push requires --tag')

const current = packageJson.version
if (!semver.valid(current)) fail('package.json contains invalid SemVer: ' + current)
const explicitVersion = mode.startsWith('v') ? mode.slice(1) : mode
const nextVersion = modes.has(mode) ? semver.inc(current, mode, preid) : semver.valid(explicitVersion) ? explicitVersion : null
if (!nextVersion) fail('Invalid bump mode or SemVer: ' + mode)

const tagName = 'v' + nextVersion
const dirtyBefore = git('status', '--porcelain')
const versionChanged = nextVersion !== current

if (!versionChanged && !createTag) fail('Version is already ' + nextVersion)
if (createTag && dirtyBefore) fail('Refusing --tag with a dirty worktree. Commit or stash existing changes first.')
if (git('rev-parse', '--verify', '--quiet', 'refs/tags/' + tagName)) fail('Git tag ' + tagName + ' already exists')

console.log(packageJson.name + ': ' + current + ' -> ' + nextVersion)
console.log('Release tag: ' + tagName)
if (dryRun) process.exit(0)

if (versionChanged) {
  packageJson.version = nextVersion
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + String.fromCharCode(10))
  const readme = readFileSync(readmePath, 'utf8')
    .replaceAll('v' + current, 'v' + nextVersion)
    .replaceAll('dsh-notify-' + current + '.tgz', 'dsh-notify-' + nextVersion + '.tgz')
  writeFileSync(readmePath, readme)
}

if (createTag) {
  if (versionChanged) execFileSync('pnpm', ['install', '--lockfile-only'], { cwd: root, stdio: 'inherit' })
  execFileSync('pnpm', ['run', 'check'], { cwd: root, stdio: 'inherit' })
  execFileSync('git', ['diff', '--exit-code', '--', 'lib'], { cwd: root, stdio: 'inherit' })
  if (versionChanged) {
    execFileSync('git', ['add', 'package.json', 'pnpm-lock.yaml', 'README.md'], { cwd: root, stdio: 'inherit' })
    execFileSync('git', ['commit', '-m', 'chore(release): ' + tagName], { cwd: root, stdio: 'inherit' })
  }
  execFileSync('git', ['tag', '--annotate', tagName, '--message', packageJson.name + ' ' + tagName], { cwd: root, stdio: 'inherit' })
  if (push) execFileSync('git', ['push', 'origin', 'HEAD', tagName], { cwd: root, stdio: 'inherit' })
  console.log('Created ' + tagName + (push ? '. Pushed commit and tag.' : '. Push it with: git push origin HEAD ' + tagName))
} else {
  console.log('Updated package.json. Run pnpm install --lockfile-only and pnpm run check, then create ' + tagName + '.')
}

function git(...arguments_) {
  try { return execFileSync('git', arguments_, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return '' }
}

function fail(message) {
  console.error('bump-version: ' + message)
  process.exit(1)
}
