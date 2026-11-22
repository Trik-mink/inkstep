import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// A portable artifact of the public component, not a replacement SDK runtime.
const root = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.argv[2] || resolve(root, 'artifacts/handwriting-preview.html'))
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/lab-entry.tsx'],
  bundle: true, write: false, outdir: 'export', format: 'iife',
  platform: 'browser', target: ['safari17', 'chrome120'], minify: true,
  loader: { '.png': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' },
})
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script')
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Inkstep | Handwriting lab</title><style>html,body{margin:0;background:#faf9f5;color-scheme:light}${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
await mkdir(dirname(output), { recursive: true })
await writeFile(output, html)
console.log(`Standalone capture preview: ${output}`)
