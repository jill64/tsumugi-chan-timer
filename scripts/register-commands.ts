import { REST, Routes } from 'discord.js'
import 'dotenv/config'
import { env } from 'node:process'

const commands = [
  {
    name: 'register',
    description: '今入っているVCを測定対象にするよ！'
  },
  {
    name: 'unregister',
    description: '今入っているVCを測定対象から外すよ！'
  },
  {
    name: 'show',
    description: 'あなたの累計作業時間を表示するよ！'
  },
  {
    name: 'set',
    description: 'このコマンドを実行したチャンネルに通知を送信するよ！'
  },
  {
    name: 'mute',
    description: '通知を送信しないようにするよ！'
  }
]

const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN!)

await rest.put(Routes.applicationCommands(env.DISCORD_APPLICATION_ID!), {
  body: commands
})
