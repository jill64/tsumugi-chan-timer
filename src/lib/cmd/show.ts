import { Cmd } from '../../types/Cmd.js'
import { getOrInsertUser } from '../getOrInsertUser.js'

export const show: Cmd = async (interaction, db) => {
  const user = await getOrInsertUser(interaction.member.user.id, db)

  const hour = Math.floor(user.all / 60)
  const minute = user.all % 60

  return `あなたの累計作業時間は${hour}時間${minute}分だよ！`
}
