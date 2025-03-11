import { Kysely } from 'kysely'
import { getOrInsertUser } from './getOrInsertUser.js'
import { Database } from './schema.js'

export const connect = async ({
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

  const channels = new Set<string>(JSON.parse(user.channels))

  if (!channels.has(channelId)) {
    return
  }

  await db
    .updateTable('user')
    .set('start', new Date().toISOString())
    .where('id', '=', memberId)
    .execute()
}
