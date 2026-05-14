#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const GROUPS = new Set(['auth', 'policies', 'catalog', 'content', 'integrations', 'behavioral', 'core'])

function run(command, args) {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command
  const result = spawnSync(executable, args, {
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

function printUsage() {
  console.log('Usage: npx db push seed:<group>')
  console.log('Available groups: auth, policies, catalog, content, integrations, behavioral, core')
}

const args = process.argv.slice(2)
const [action, seedArg] = args

if (action !== 'push' || !seedArg || !seedArg.startsWith('seed:')) {
  printUsage()
  process.exit(1)
}

const group = seedArg.slice('seed:'.length)

if (!GROUPS.has(group)) {
  console.error(`Unknown seed group: ${group}`)
  printUsage()
  process.exit(1)
}

console.log('➡️ Running prisma db push...')
run('npx', ['prisma', 'db', 'push'])

console.log(`➡️ Running seed group: ${group}...`)
run('npm', ['run', `seed:${group}`])

console.log('✅ Done')
