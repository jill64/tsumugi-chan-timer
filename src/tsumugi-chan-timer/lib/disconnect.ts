import dayjs from 'dayjs'
import { db } from './db.js'
import { getOrInsertUser } from './getOrInsertUser.js'
import { getOrInsertUserGuildChannel } from './getOrInsertUserGuildChannel.js'

export const disconnect = async ({
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

  if (!user.start) {
    return
  }

  const channels = new Set<string>(JSON.parse(user.channels))

  if (!channels.has(channelId)) {
    return
  }

  const start = dayjs(user.start)
  const diff = dayjs().diff(start, 'minute')
  const all = user.all + diff

  await db
    .updateTable('user')
    .set('all', all)
    .set('start', '')
    .where('id', '=', memberId)
    .execute()

  return {
    diff,
    all,
    user_guild_channel
  }
}
