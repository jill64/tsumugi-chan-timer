import { Kysely } from 'kysely'
import { getOrInsertUser } from './getOrInsertUser.js'
import { getOrInsertUserGuildChannel } from './getOrInsertUserGuildChannel.js'
import { Database } from './schema.js'

export const connect = async ({
  channelId,
  memberId,
  guildId,
  db
}: {
  guildId: string
  memberId: string
  channelId: string
  db: Kysely<Database>
}) => {
  if (!channelId || !memberId) {
    return
  }

  const [user, user_guild_channel] = await Promise.all([
    getOrInsertUser(memberId, db),
    getOrInsertUserGuildChannel(memberId, guildId, db)
  ])

  const channels = new Set<string>(JSON.parse(user.channels))

  if (!channels.has(channelId)) {
    return
  }

  await db
    .updateTable('user')
    .set('start', new Date().toISOString())
    .where('id', '=', memberId)
    .execute()

  return user_guild_channel
}
