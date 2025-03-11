import { Kysely } from 'kysely'
import { VoiceState } from '../../types/VoiceState.js'
import { connect } from '../connect.js'
import { disconnect } from '../disconnect.js'
import { Database } from '../schema.js'
import { send_embed } from './send_embed.js'

const start_messages = [
  '作業開始！',
  '作業開始だよ！',
  '作業スタートだよ！',
  '作業がんばってね！'
]

const random_start_message = () =>
  start_messages[Math.floor(Math.random() * start_messages.length)]

const end_messages = ['作業終了だよ！お疲れ様！', '作業おわり！おつかれさま！']

const random_end_message = () =>
  end_messages[Math.floor(Math.random() * end_messages.length)]

export const voice = async (
  request: Request,
  bot_token: string,
  db: Kysely<Database>
): Promise<Response> => {
  const { old_state, new_state } = (await request.json()) as {
    old_state: VoiceState
    new_state: VoiceState
  }

  if (old_state.bot || new_state.bot) {
    return new Response('Bot is not allowed', { status: 400 })
  }

  if (!old_state.channel_id && new_state.channel_id) {
    if (!new_state.user_id) {
      return new Response('User not found on connect', { status: 400 })
    }

    const res = await connect({
      channelId: new_state.channel_id,
      memberId: new_state.user_id,
      db
    })

    if (res) {
      return await send_embed(
        new_state.channel_id,
        `${new_state.user_name}さん！${random_start_message()}`,
        bot_token
      )
    }

    return new Response('Connected', { status: 200 })
  }

  if (old_state.channel_id && !new_state.channel_id) {
    if (!old_state.user_id) {
      return new Response('User not found on disconnect', { status: 400 })
    }

    const res = await disconnect({
      channelId: old_state.channel_id,
      memberId: old_state.user_id,
      db
    })

    if (!res) {
      return new Response('User data not found on disconnect', { status: 400 })
    }

    return await send_embed(
      old_state.channel_id,
      `${old_state.user_name}さん！${random_end_message()}
今回の作業時間は**${res.diff}分**！
総作業時間は**${Math.floor(res.all / 60)}時間${res.all % 60}分**だよ！`,
      bot_token
    )
  }

  if (
    old_state.channel_id &&
    new_state.channel_id &&
    old_state.channel_id !== new_state.channel_id
  ) {
    if (!old_state.user_id || !new_state.user_id) {
      return new Response('User not found on change', { status: 400 })
    }

    const end = await disconnect({
      channelId: old_state.channel_id,
      memberId: old_state.user_id,
      db
    })

    if (end) {
      await send_embed(
        old_state.channel_id,
        `${old_state.user_name}さん！${random_end_message()}
今回の作業時間は**${end.diff}分**！
総作業時間は**${Math.floor(end.all / 60)}時間${end.all % 60}分**だよ！`,
        bot_token
      )
    }

    const res = await connect({
      channelId: new_state.channel_id,
      memberId: new_state.user_id,
      db
    })

    if (res) {
      return await send_embed(
        new_state.channel_id,
        `${new_state.user_name}さん！${random_start_message()}`,
        bot_token
      )
    }

    return new Response('Changed', { status: 200 })
  }

  return new Response('No Action')
}
