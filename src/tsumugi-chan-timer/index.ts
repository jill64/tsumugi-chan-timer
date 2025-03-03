import dayjs from 'dayjs'
import { Client, GatewayIntentBits, VoiceState } from 'discord.js'
import { Kysely } from 'kysely'
import { SolarSystemDialect } from 'kysely-solarsystem'
import { env } from 'node:process'
import type { Database } from './schema.js'

const db = new Kysely<Database>({
  dialect: new SolarSystemDialect({
    teamName: 'jill64',
    clusterName: 'Tsumugi-Chan-Timer',
    branchName: 'main',
    apiKey: env.SOLARSYSTEM_API_KEY!
  })
})

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
})

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

const getOrInsertUser = async (userId: string) => {
  const user = await db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst()

  if (user) {
    return user
  }

  await db
    .insertInto('user')
    .values({
      id: userId,
      channels: JSON.stringify([]),
      start: '',
      all: 0
    })
    .execute()

  return await db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirstOrThrow()
}

const getOrInsertUserGuildChannel = async (
  userId: string,
  guild_id: string
) => {
  const user_guild_channel = await db
    .selectFrom('user_guild_channel')
    .selectAll()
    .where('id', '=', userId)
    .where('guild_id', '=', guild_id)
    .executeTakeFirst()

  if (user_guild_channel) {
    return user_guild_channel
  }

  await db
    .insertInto('user_guild_channel')
    .values({
      id: userId,
      guild_id,
      channel_id: ''
    })
    .execute()

  return await db
    .selectFrom('user_guild_channel')
    .selectAll()
    .where('id', '=', userId)
    .where('guild_id', '=', guild_id)
    .executeTakeFirstOrThrow()
}

client.on('voiceStateUpdate', async (oldState, newState) => {
  const connect = async (state: VoiceState) => {
    if (!state.channelId || !state.member) {
      return
    }

    const [user, user_guild_channel] = await Promise.all([
      getOrInsertUser(state.member.id),
      getOrInsertUserGuildChannel(state.member.id, state.guild.id)
    ])

    const channels = new Set<string>(JSON.parse(user.channels))

    if (!channels.has(state.channelId)) {
      return
    }

    await db
      .updateTable('user')
      .set('start', new Date().toISOString())
      .where('id', '=', state.member.id)
      .execute()
  }

  const disconnect = async (state: VoiceState) => {
    if (!state.channelId || !state.member) {
      return
    }

    const [user, user_guild_channel] = await Promise.all([
      getOrInsertUser(state.member.id),
      getOrInsertUserGuildChannel(state.member.id, state.guild.id)
    ])

    if (!user.start) {
      return
    }

    const channels = new Set<string>(JSON.parse(user.channels))

    if (!channels.has(state.channelId)) {
      return
    }

    const start = dayjs(user.start)
    const diff = dayjs().diff(start, 'minute')
    const all = user.all + diff

    await db
      .updateTable('user')
      .set('all', all)
      .set('start', '')
      .where('id', '=', state.member.id)
      .execute()
  }

  if (!oldState.channelId && newState.channelId) {
    await connect(newState)
  }

  if (oldState.channelId && !newState.channelId) {
    await disconnect(oldState)
  }

  if (
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId
  ) {
    await disconnect(oldState)
    await connect(newState)
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  await interaction.deferReply()

  const user = await getOrInsertUser(interaction.user.id)

  // @ts-expect-error TODO: Fix this
  const vcId = interaction.member.voice.channel.id as string | null

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
