import { Kysely } from 'kysely'
import { Database } from '../lib/schema.js'
import { Interaction } from './Interaction.js'

export type Cmd = (
  interaction: Interaction,
  db: Kysely<Database>
) => Promise<string>
