import { REST, Routes } from 'discord.js'
import 'dotenv/config'
import { env } from 'node:process'

const commands = [
  {
    name: 'register',
    description: '選択したVCを測定対象にするよ！',
    options: [
      {
        name: 'voice_channel',
        description: '測定対象にするVCを選択してね！',
        type: 7,
        channel_types: [2],
        required: true
      }
    ]
  },
  {
    name: 'unregister',
    description: '選択したVCを測定対象から外すよ！',
    options: [
      {
        name: 'voice_channel',
        description: '測定対象から外すVCを選択してね！',
        type: 7,
        channel_types: [2],
        required: true
      }
    ]
  },
  {
    name: 'show',
    description: 'あなたの累計作業時間を表示するよ！'
  }
]

const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN!)

await rest.put(Routes.applicationCommands(env.DISCORD_APPLICATION_ID!), {
  body: commands
})
