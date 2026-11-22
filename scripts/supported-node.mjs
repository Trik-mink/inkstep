import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs a command under a Node version allowed by package.json `engines`.
// Shells that default to an older Node switch to the .nvmrc version through nvm.
// Usage: node scripts/supported-node.mjs <command> [...args]
const root = fileURLToPath(new URL('..', import.meta.url))
const range = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).engines.node
const [command, ...args] = process.argv.slice(2)
if (!command) fail('Usage: node scripts/supported-node.mjs <command> [...args]')

function fail(message) {
  console.error(`supported-node: ${message}`)
  process.exit(1)
}

function parts(version) {
  return version.replace(/^v/, '').split('.').map(Number)
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff) return diff
  }
  return 0
}

function satisfies(version, engines) {
  const current = parts(version)
  return engines.split('||').some(set => set.trim().split(/\s+/).every(comparator => {
    const [, op, target] = comparator.match(/^(>=|<=|>|<|=)?v?(\d+(?:\.\d+){0,2})$/) ?? fail(`Unsupported engines comparator "${comparator}"`)
    const diff = compare(current, parts(target))
    return { '>=': diff >= 0, '<=': diff <= 0, '>': diff > 0, '<': diff < 0 }[op] ?? diff === 0
  }))
}

function exit(result) {
  if (result.error) fail(result.error.message)
  process.exit(result.status ?? 1)
}

if (satisfies(process.versions.node, range)) {
  exit(spawnSync(command, args, { stdio: 'inherit' }))
}

if (process.env.SUPPORTED_NODE_SWITCHED) {
  fail(`nvm selected Node ${process.versions.node}, which does not satisfy engines "${range}". Update .nvmrc.`)
}

const wanted = readFileSync(join(root, '.nvmrc'), 'utf8').trim()
const nvm = join(process.env.NVM_DIR || join(homedir(), '.nvm'), 'nvm.sh')
if (!existsSync(nvm)) {
  fail(`Node ${process.versions.node} does not satisfy engines "${range}" and nvm was not found. Install Node ${wanted} or run with a supported Node.`)
}

console.error(`supported-node: Node ${process.versions.node} does not satisfy engines "${range}"; using Node ${wanted} through nvm.`)
// nvm.sh is a bash script; the selected Node re-runs this file so the version is checked again.
exit(spawnSync('bash', [
  '-c', '. "$0" --no-use && nvm exec --silent "$1" node "${@:2}"',
  nvm, wanted, fileURLToPath(import.meta.url), command, ...args,
], { stdio: 'inherit', env: { ...process.env, SUPPORTED_NODE_SWITCHED: '1' } }))
