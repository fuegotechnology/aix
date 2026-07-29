import * as esbuild from 'esbuild'
import { chmodSync, writeFileSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))

await esbuild.build({
  entryPoints: [resolve(ROOT, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: ['node18', 'es2022'],
  format: 'cjs',
  outfile: resolve(ROOT, 'dist/cli.js'),
  banner: { js: '#!/usr/bin/env node' },
  define: { 'process.env.AIX_VERSION': JSON.stringify(pkg.version) },
  minify: true,
  logLevel: 'info',
})

writeFileSync(resolve(ROOT, 'dist/package.json'), JSON.stringify({ type: 'commonjs' }))
chmodSync(resolve(ROOT, 'dist/cli.js'), 0o755)
console.log(`✅ dist/cli.js built — ${pkg.name}@${pkg.version}`)
