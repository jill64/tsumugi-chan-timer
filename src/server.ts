import {
  InteractionResponseType,
  InteractionType,
  verifyKey
} from 'discord-interactions'
import { AutoRouter } from 'itty-router'
import { Kysely } from 'kysely'
import { SolarSystemDialect } from 'kysely-solarsystem'
import crypto from 'node:crypto'
import { register, show, unregister } from './lib/cmd/index.js'
import type { Database } from './lib/schema.js'
import { voice } from './lib/voice/index.js'
import { Interaction } from './types/Interaction.js'

interface Env {
  DISCORD_PUBLIC_KEY: string
  DISCORD_APPLICATION_ID: string
  SOLARSYSTEM_API_KEY: string
  TRAVELERS_TOKEN: string
  DISCORD_BOT_TOKEN: string
}

const router = AutoRouter()

router.get('/', () => {
  return new Response("👋 Hi, I'm Kasukabe Tsumugi")
})

router.post('/', async (request, env: Env, ctx) => {
  const db = new Kysely<Database>({
    // @ts-expect-error TODO: Fix this
    dialect: new SolarSystemDialect({
      teamName: 'jill64',
      clusterName: 'Tsumugi-Chan-Timer',
      branchName: 'main',
      apiKey: env.SOLARSYSTEM_API_KEY
    })
  })

  const req_token = (request.headers.get('Authorization') ?? '').replace(
    'Bearer ',
    ''
  )

  if (req_token) {
    const env_token = env.TRAVELERS_TOKEN

    if (
      !crypto.timingSafeEqual(Buffer.from(req_token), Buffer.from(env_token))
    ) {
      return new Response('Invalid Token', { status: 401 })
    }

    const res = await voice(request, env.DISCORD_BOT_TOKEN, db)

    return res
  }

  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env
  )

  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 })
  }

  if (interaction.type === InteractionType.PING) {
    return Response.json({
      type: InteractionResponseType.PONG
    })
  }

  const reply = async (message: Promise<string>) => {
    const content = await message

    await fetch(
      `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`,
      {
        method: 'POST',
        body: JSON.stringify({
          content
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const res = Response.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    })

    switch (interaction.data.name.toLowerCase()) {
      case 'show': {
        const str = show(interaction, db)
        ctx.waitUntil(reply(str))

        return res
      }

      case 'register': {
        const str = register(interaction, db)
        ctx.waitUntil(reply(str))

        return res
      }

      case 'unregister': {
        const str = unregister(interaction, db)
        ctx.waitUntil(reply(str))

        return res
      }

      default:
        return Response.json(
          {
            error: 'Unknown Type'
          },
          {
            status: 400
          }
        )
    }
  }

  return Response.json({ error: 'Unknown Type' }, { status: 400 })
})

router.all('*', () => new Response('Not Found.', { status: 404 }))

async function verifyDiscordRequest(request: Request, env: Env) {
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  const body = await request.text()
  const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY))
  if (!isValidRequest) {
    return { isValid: false }
  }

  return {
    interaction: JSON.parse(body) as Interaction,
    isValid: true
  }
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch
}

export default server
