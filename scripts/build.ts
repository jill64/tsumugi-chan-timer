import { build } from 'esbuild'
import { cp } from 'node:fs/promises'
import path from 'node:path'

const exec = (name: string) =>
  Promise.all([
    build({
      entryPoints: [path.resolve('src', name, 'index.ts')],
      outfile: path.resolve('dist', name, 'index.js'),
      format: 'esm',
      bundle: true,
      minify: true,
      platform: 'node',
      target: 'node20',
      external: [
        'node:*',
        '@aws-sdk/*',
        'discord.js',
        'kysely',
        'kysely-solarsystem'
      ]
    }),
    cp(
      path.resolve('src', name, 'Dockerfile'),
      path.resolve('dist', name, 'Dockerfile')
    ),
    cp(
      path.resolve('src', name, 'package.json'),
      path.resolve('dist', name, 'package.json')
    )
  ])

await exec('tsumugi-chan-timer')
