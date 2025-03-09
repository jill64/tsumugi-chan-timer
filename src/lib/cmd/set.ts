import { Cmd } from '../../types/Cmd.js'
import { getOrInsertUserGuildChannel } from '../getOrInsertUserGuildChannel.js'

export const set: Cmd = async (interaction, db) => {
  if (!interaction.guild_id) {
    return 'このコマンドはサーバー内で実行してね！'
  }

  await getOrInsertUserGuildChannel(
    interaction.member.user.id,
    interaction.guild.id,
    db
  )

  await db
    .updateTable('user_guild_channel')
    .set('channel_id', interaction.channel.id)
    .where('id', '=', interaction.member.user.id)
    .where('guild_id', '=', interaction.guild.id)
    .execute()

  return '通知先をここに設定したよ！'
}
