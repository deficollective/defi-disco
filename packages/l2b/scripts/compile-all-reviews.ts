/* eslint-disable */
import type { DiscoveryPaths } from '@l2beat/discovery'
import * as fs from 'fs'
import * as path from 'path'
import { ReviewCompiler } from '../src/implementations/discovery-ui/defidisco/reviewCompiler'

const repoRoot = path.resolve(__dirname, '../../..')
const paths: DiscoveryPaths = {
  root: repoRoot,
  discovery: path.join(repoRoot, 'packages/config/src/projects'),
} as DiscoveryPaths

const configPath = path.join(
  repoRoot,
  'packages/config/src/defidisco-config.json',
)
const projects: string[] = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  .defiProjects

const filterArg = process.argv[2]
const targets = filterArg
  ? projects.filter((p) => p === filterArg)
  : projects

if (targets.length === 0) {
  console.error(`No projects matched filter "${filterArg ?? ''}"`)
  process.exit(1)
}

console.log(`Compiling ${targets.length} project(s)…`)

const compiler = new ReviewCompiler(paths, () => {})
let ok = 0
let skipped = 0
let failed = 0
const errors: string[] = []

for (const project of targets) {
  const t0 = Date.now()
  try {
    const result = compiler.compile(project)
    const dt = Date.now() - t0
    if (result.status === 'success') {
      ok++
      console.log(`  ✓ ${project} (${dt}ms)`)
    } else if (result.status === 'skipped') {
      skipped++
      console.log(`  - ${project} skipped: ${(result as any).reason}`)
    } else {
      failed++
      const msg = (result as any).error ?? 'unknown error'
      errors.push(`${project}: ${msg}`)
      console.log(`  ✗ ${project} failed: ${msg}`)
    }
  } catch (err) {
    failed++
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`${project}: ${msg}`)
    console.log(`  ✗ ${project} threw: ${msg}`)
  }
}

console.log(
  `\nDone. success=${ok}  skipped=${skipped}  failed=${failed}  total=${targets.length}`,
)
if (errors.length > 0) {
  console.log('\nErrors:')
  for (const e of errors) console.log('  - ' + e)
  process.exit(1)
}
