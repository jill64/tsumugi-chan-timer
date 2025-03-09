import { Kysely } from 'kysely'
import { Database } from './schema.js'

export const getOrInsertUser = async (userId: string, db: Kysely<Database>) => {
  const user = await db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst()

  if (user) {
    return user
  }

  await db
    .insertInto('user')
    .values({
      id: userId,
      channels: JSON.stringify([]),
      start: '',
      all: 0
    })
    .execute()

  return await db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirstOrThrow()
}
