import { db } from './db.js'
import { getOrInsertUser } from './getOrInsertUser.js'
import { getOrInsertUserGuildChannel } from './getOrInsertUserGuildChannel.js'

export const connect = async ({
  channelId,
  memberId,
  guildId
}: {
  guildId: string
  memberId: string
  channelId: string
}) => {
  if (!channelId || !memberId) {
    return
  }

  const [user, user_guild_channel] = await Promise.all([
    getOrInsertUser(memberId),
    getOrInsertUserGuildChannel(memberId, guildId)
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
