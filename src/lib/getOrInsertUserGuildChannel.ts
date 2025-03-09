import { Kysely } from 'kysely'
import { Database } from './schema.js'

export const getOrInsertUserGuildChannel = async (
  userId: string,
  guild_id: string,
  db: Kysely<Database>
) => {
  const user_guild_channel = await db
    .selectFrom('user_guild_channel')
    .selectAll()
    .where('id', '=', userId)
    .where('guild_id', '=', guild_id)
    .executeTakeFirst()

  if (user_guild_channel) {
    return user_guild_channel
  }

  await db
    .insertInto('user_guild_channel')
    .values({
      id: userId,
      guild_id,
      channel_id: ''
    })
    .execute()

  return await db
    .selectFrom('user_guild_channel')
    .selectAll()
    .where('id', '=', userId)
    .where('guild_id', '=', guild_id)
    .executeTakeFirstOrThrow()
}
