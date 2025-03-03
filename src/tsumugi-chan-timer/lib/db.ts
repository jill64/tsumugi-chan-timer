import { Kysely } from 'kysely'
import { SolarSystemDialect } from 'kysely-solarsystem'
import { env } from 'node:process'
import type { Database } from './schema.js'

export const db = new Kysely<Database>({
  dialect: new SolarSystemDialect({
    teamName: 'jill64',
    clusterName: 'Tsumugi-Chan-Timer',
    branchName: 'main',
    apiKey: env.SOLARSYSTEM_API_KEY!
  })
})
