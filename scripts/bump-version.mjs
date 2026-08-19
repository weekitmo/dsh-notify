#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
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
if (!preid || !semver.valid('0.0.0-' + preid)) fail('--preid must contain valid dot-separated SemVer identifiers')
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
if (tagExists(tagName)) fail('Git tag ' + tagName + ' already exists')

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
  if (push) execFileSync('git', ['push', '--atomic', 'origin', 'HEAD', tagName], { cwd: root, stdio: 'inherit' })
  console.log('Created ' + tagName + (push ? '. Pushed commit and tag.' : '. Push it with: git push --atomic origin HEAD ' + tagName))
} else {
  console.log('Updated package.json. Run pnpm install --lockfile-only and pnpm run check, then create ' + tagName + '.')
}

function git(...arguments_) {
  try {
    return execFileSync('git', arguments_, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (error) {
    fail('git ' + arguments_.join(' ') + ' failed: ' + (error.stderr?.trim() || error.message))
  }
}

function tagExists(tagName) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', 'refs/tags/' + tagName], { cwd: root, encoding: 'utf8' })
  if (result.error) fail('git show-ref failed: ' + result.error.message)
  if (result.status === 0) return true
  if (result.status === 1) return false
  fail('git show-ref failed with exit code ' + result.status + ': ' + result.stderr.trim())
}

function fail(message) {
  console.error('bump-version: ' + message)
  process.exit(1)
}
