import { Cmd } from '../../types/Cmd.js'
import { disconnect } from '../disconnect.js'
import { getOrInsertUser } from '../getOrInsertUser.js'

export const unregister: Cmd = async (interaction, db) => {
  const vcId = interaction.data.options.find(
    (option) => option.name === 'voice_channel'
  )?.value

  if (!vcId) {
    return '指定されたVCが見つからないよ！'
  }

  const user = await getOrInsertUser(interaction.member.user.id, db)

  const channels = new Set<string>(JSON.parse(user.channels))

  if (!channels.has(vcId)) {
    return 'このチャンネルは登録されていないよ！'
  }

  channels.delete(vcId)

  await disconnect({
    channelId: vcId,
    memberId: interaction.member.user.id,
    guildId: interaction.guild_id,
    db
  })

  await db
    .updateTable('user')
    .set('channels', JSON.stringify([...channels]))
    .where('id', '=', interaction.member.user.id)
    .execute()

  return '登録解除したよ！'
}
