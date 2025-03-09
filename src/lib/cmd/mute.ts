import { Cmd } from '../../types/Cmd.js'
import { getOrInsertUserGuildChannel } from '../getOrInsertUserGuildChannel.js'

export const mute: Cmd = async (interaction, db) => {
  if (!interaction.guild_id) {
    return 'このコマンドはサーバー内で実行してね！'
  }

  await getOrInsertUserGuildChannel(
    interaction.member.user.id,
    interaction.guild_id,
    db
  )

  await db
    .updateTable('user_guild_channel')
    .set('channel_id', '')
    .where('id', '=', interaction.member.user.id)
    .where('guild_id', '=', interaction.guild_id)
    .execute()

  return '通知設定を解除したよ！'
}
