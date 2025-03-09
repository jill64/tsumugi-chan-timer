import { Cmd } from '../../types/Cmd.js'
import { connect } from '../connect.js'
import { getOrInsertUser } from '../getOrInsertUser.js'

export const register: Cmd = async (interaction, db) => {
  const vcId = interaction.data.options.find(
    (option) => option.name === 'voice_channel'
  )?.value

  if (!vcId) {
    return '指定されたVCが見つからないよ！'
  }

  const user = await getOrInsertUser(interaction.member.user.id, db)

  const channels = new Set<string>(JSON.parse(user.channels))

  if (channels.has(vcId)) {
    return 'このチャンネルはもう登録されてるよ！'
  }

  channels.add(vcId)

  await db
    .updateTable('user')
    .set('channels', JSON.stringify([...channels]))
    .where('id', '=', interaction.member.user.id)
    .execute()

  await connect({
    channelId: vcId,
    memberId: interaction.member.user.id,
    guildId: interaction.guild_id,
    db
  })

  return '登録完了したよ！'
}
