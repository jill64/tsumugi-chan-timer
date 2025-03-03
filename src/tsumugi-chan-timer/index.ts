import { Client, GatewayIntentBits } from 'discord.js'
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
    .executeTakeFirst()
}

client.on('voiceStateUpdate', async (oldState, newState) => {
  // const connect = async (state: VoiceState) => {
  //   // if (
  //   //   !state.channelId
  //   //   // || !state.member
  //   // ) {
  //   //   return
  //   // }
  //   // await checkOrInsertUser(state.member.id)
  //   // const channels = await db
  //   //   .selectFrom('guild_channel')
  //   //   .selectAll()
  //   //   .where('guild_channel.guild_id', '=', state.guild.id)
  //   //   .execute()
  //   // if (!channels.find((channel) => channel.channel_id === state.channelId)) {
  //   //   return
  //   // }
  //   await run(
  //     db.insertInto('timestamp').values({
  //       guild_id: state.guild.id,
  //       channel_id: state.channelId ?? '',
  //       user_id: state.member?.id ?? '',
  //       start: new Date().toISOString(),
  //       end: ''
  //     })
  //   )
  // }
  // const disconnect = async (state: VoiceState) => {
  //   // if (
  //   //   !state.channelId
  //   //   // || !state.member
  //   // ) {
  //   //   return
  //   // }
  //   await checkOrInsertGuild(state.guild.id)
  //   await run(
  //     db
  //       .updateTable('timestamp')
  //       .set('end', new Date().toISOString())
  //       .where('guild_id', '=', state.guild.id)
  //       .where('channel_id', '=', state.channelId)
  //       .where('user_id', '=', state.member?.id ?? '')
  //       .where('end', '=', '')
  //   )
  // }
  // if (!oldState.channelId && newState.channelId) {
  //   await connect(newState)
  // }
  // if (oldState.channelId && !newState.channelId) {
  //   await disconnect(oldState)
  // }
  // if (
  //   oldState.channelId &&
  //   newState.channelId &&
  //   oldState.channelId !== newState.channelId
  // ) {
  //   await Promise.all([disconnect(oldState), connect(newState)])
  // }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  await interaction.deferReply()

  const user = await getOrInsertUser(interaction.user.id)

  if (!user) {
    await interaction.editReply(
      '内部エラーが発生したみたい… もう一度試してみてね！'
    )
    return
  }

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
})

client.login(process.env.DISCORD_BOT_TOKEN)
