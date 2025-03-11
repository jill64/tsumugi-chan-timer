import dayjs from 'dayjs'
import { Kysely } from 'kysely'
import { getOrInsertUser } from './getOrInsertUser.js'
import { Database } from './schema.js'

export const disconnect = async ({
  channelId,
  memberId,
  db
}: {
  memberId: string
  channelId: string
  db: Kysely<Database>
}) => {
  if (!channelId || !memberId) {
    return
  }

  const user = await getOrInsertUser(memberId, db)

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
    all
  }
}
