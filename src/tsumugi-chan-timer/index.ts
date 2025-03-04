import { EmbedBuilder } from 'discord.js'
import { client } from './lib/client.js'
import { connect } from './lib/connect.js'
import { db } from './lib/db.js'
import { disconnect } from './lib/disconnect.js'
import { getOrInsertUser } from './lib/getOrInsertUser.js'
import { getOrInsertUserGuildChannel } from './lib/getOrInsertUserGuildChannel.js'

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

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

const send_message = (channelId: string, message: string) => {
  const channel = client.channels.cache.get(channelId)

  if (!channel) {
    return
  }

  const embed = new EmbedBuilder().setColor(0xb69f74).setDescription(message)

  // @ts-expect-error TODO: Fix this
  channel.send({ embeds: [embed] })
}

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.member?.user.bot || newState.member?.user.bot) {
    return
  }

  if (!oldState.channelId && newState.channelId) {
    if (!newState.member?.id) {
      return
    }

    const res = await connect({
      channelId: newState.channelId,
      memberId: newState.member.id,
      guildId: newState.guild.id
    })

    if (!res) {
      return
    }

    send_message(
      res.channel_id,
      `${newState.member.displayName}さん！${random_start_message()}`
    )
  }

  if (oldState.channelId && !newState.channelId) {
    if (!oldState.member?.id) {
      return
    }

    const res = await disconnect({
      channelId: oldState.channelId,
      memberId: oldState.member.id,
      guildId: oldState.guild.id
    })

    if (!res) {
      return
    }

    send_message(
      res.user_guild_channel.channel_id,
      `${oldState.member.displayName}さん！${random_end_message()}
今回の作業時間は**${res.diff}分**！
総作業時間は**${Math.floor(res.all / 60)}時間${res.all % 60}分**だよ！`
    )
  }

  if (
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId
  ) {
    if (!oldState.member?.id || !newState.member?.id) {
      return
    }

    const end = await disconnect({
      channelId: oldState.channelId,
      memberId: oldState.member.id,
      guildId: oldState.guild.id
    })

    if (end) {
      send_message(
        end.user_guild_channel.channel_id,
        `${oldState.member.displayName}さん！${random_end_message()}
今回の作業時間は**${end.diff}分**！
総作業時間は**${Math.floor(end.all / 60)}時間${end.all % 60}分**だよ！`
      )
    }

    const start = await connect({
      channelId: newState.channelId,
      memberId: newState.member.id,
      guildId: newState.guild.id
    })

    if (start) {
      send_message(
        start.channel_id,
        `${newState.member.displayName}さん！${random_start_message()}`
      )
    }
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  await interaction.deferReply()

  const user = await getOrInsertUser(interaction.user.id)

  // @ts-expect-error TODO: Fix this
  const vcId = interaction.member?.voice?.channel?.id as string | null

  const channels = new Set<string>(JSON.parse(user.channels))

  if (interaction.commandName === 'register') {
    if (vcId === null) {
      await interaction.editReply('VCに入ってからこのコマンドを実行してね！')
      return
    }

    if (channels.has(vcId)) {
      await interaction.editReply('このチャンネルはもう登録されてるよ！')
      return
    }

    channels.add(vcId)

    await db
      .updateTable('user')
      .set('channels', JSON.stringify([...channels]))
      .where('id', '=', interaction.user.id)
      .execute()

    await connect({
      channelId: vcId,
      memberId: interaction.user.id,
      guildId: interaction.guildId ?? ''
    })

    await interaction.editReply('登録完了したよ！')

    return
  }

  if (interaction.commandName === 'unregister') {
    if (vcId === null) {
      await interaction.editReply('VCに入ってからこのコマンドを実行してね！')
      return
    }

    if (!channels.has(vcId)) {
      await interaction.editReply('このチャンネルは登録されていないよ！')
      return
    }

    channels.delete(vcId)

    await disconnect({
      channelId: vcId,
      memberId: interaction.user.id,
      guildId: interaction.guildId ?? ''
    })

    await db
      .updateTable('user')
      .set('channels', JSON.stringify([...channels]))
      .where('id', '=', interaction.user.id)
      .execute()

    await interaction.editReply('登録解除したよ！')

    return
  }

  if (interaction.commandName === 'show') {
    const hour = Math.floor(user.all / 60)
    const minute = user.all % 60

    await interaction.editReply(
      `あなたの累計作業時間は${hour}時間${minute}分だよ！`
    )
  }

  if (interaction.commandName === 'set') {
    if (!interaction.guildId) {
      await interaction.editReply('このコマンドはサーバー内で実行してね！')
      return
    }

    await getOrInsertUserGuildChannel(interaction.user.id, interaction.guildId)

    await db
      .updateTable('user_guild_channel')
      .set('channel_id', interaction.channelId)
      .where('id', '=', interaction.user.id)
      .where('guild_id', '=', interaction.guildId)
      .execute()

    await interaction.editReply('通知先をここに設定したよ！')

    return
  }

  if (interaction.commandName === 'mute') {
    if (!interaction.guildId) {
      await interaction.editReply('このコマンドはサーバー内で実行してね！')
      return
    }

    await getOrInsertUserGuildChannel(interaction.user.id, interaction.guildId)

    await db
      .updateTable('user_guild_channel')
      .set('channel_id', '')
      .where('id', '=', interaction.user.id)
      .where('guild_id', '=', interaction.guildId)
      .execute()

    await interaction.editReply('通知設定を解除したよ！')

    return
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
