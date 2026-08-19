#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, isAbsolute, join } from 'node:path'
import semver from 'semver'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const args = process.argv.slice(2)
let version = packageJson.version
let output = null
let from = null

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index]
  if (argument === '--') continue
  if (argument === '--version') version = args[++index]
  else if (argument.startsWith('--version=')) version = argument.slice('--version='.length)
  else if (argument === '--output') output = args[++index]
  else if (argument.startsWith('--output=')) output = argument.slice('--output='.length)
  else if (argument === '--from') from = args[++index]
  else if (argument.startsWith('--from=')) from = argument.slice('--from='.length)
  else fail('Unknown option: ' + argument)
}

const inputVersion = version.replace(/^v/, '')
if (!semver.valid(inputVersion)) fail('Invalid release version: ' + inputVersion)
version = inputVersion
const tag = 'v' + version
const tags = git('tag', '--list', 'v[0-9]*', '--sort=-v:refname').split('\n').filter(Boolean).filter(value => value !== tag)
from ||= tags[0] || null
const range = from ? from + '..HEAD' : 'HEAD'
const commits = git('log', range, '--format=%s%x09%h').split('\n').filter(Boolean)
const groups = new Map([
  ['重大变更', []],
  ['修复', []],
  ['新增', []],
  ['改进', []],
  ['维护', []],
])
const conventional = new RegExp('^([A-Za-z]+)(?:[(]([^)]*)[)])?(!)?:[ ]*(.+)$')
for (const line of commits) {
  const parts = line.split('\t')
  const subject = parts[0]
  const hash = parts[1] || ''
  const match = conventional.exec(subject)
  const type = (match?.[1] || 'chore').toLowerCase()
  const scope = match?.[2] ? match[2] + ': ' : ''
  const text = match?.[4] || subject
  const item = '- ' + scope + text + (hash ? ' (' + hash + ')' : '')
  if (match?.[3]) groups.get('重大变更').push(item)
  else if (type === 'fix' || type === 'bug') groups.get('修复').push(item)
  else if (type === 'feat' || type === 'add') groups.get('新增').push(item)
  else if (type === 'perf' || type === 'refactor' || type === 'style') groups.get('改进').push(item)
  else groups.get('维护').push(item)
}

const code = String.fromCharCode(96)
const fence = code.repeat(3)
const notes = [
  '# dsh-notify ' + tag,
  '',
  'DeepSeek Harness Web 的任务状态通知插件，提供系统通知、Tab 未读汇总和侧栏会话状态提示。',
  '',
  '## 版本亮点',
  '',
  '- 系统通知覆盖完成、错误、中止、阻塞和 Token 限制，并支持按类型开关。',
  '- 浏览器 Tab 显示运行中会话数量，并汇总未读完成或异常结果。',
  '- 侧栏会话状态灯区分成功与异常，打开会话后自动清除。',
  '- 设置页集中控制通知权限、动画、spinner、状态灯和结果类型。',
  '',
]
for (const [title, items] of groups) {
  if (items.length) notes.push('## ' + title, '', ...items, '')
}
if (!commits.length) notes.push('## 变更', '', '- 本版本没有可归类的提交记录。', '')
notes.push(
  '## 验证',
  '',
  '- ' + code + 'pnpm run check' + code + '（类型检查、测试和构建）由 GitHub Actions 在发布前执行。',
  '- 发布包包含已构建的 ' + code + 'lib/' + code + '；DSH 安装时不会自动执行插件的 build。',
  '',
  '## 安装',
  '',
  fence + 'sh',
  'dsh plugin --profile web add git+https://github.com/weekitmo/dsh-notify.git#' + tag,
  fence,
  '',
  from ? '完整变更记录：https://github.com/weekitmo/dsh-notify/compare/' + from + '...' + tag : '完整变更记录：https://github.com/weekitmo/dsh-notify/commits/' + tag,
  '',
)
const result = notes.join('\n')
if (output) {
  const outputPath = isAbsolute(output) ? output : join(root, output)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, result)
} else {
  process.stdout.write(result)
}

function git(...arguments_) {
  try {
    return execFileSync('git', arguments_, { cwd: root, encoding: 'utf8' }).trim()
  } catch (error) {
    fail('git ' + arguments_.join(' ') + ' failed: ' + error.message)
  }
}

function fail(message) {
  console.error('release-notes: ' + message)
  process.exit(1)
}
