export type Interaction = {
  channel: {
    guild_id: string
    id: string
    name: string
  }
  member: {
    user: {
      global_name: string
      id: string
      username: string
    }
  }
  data: {
    name: string
    type: number
    options: {
      name: string
      value: string
    }[]
  }
  channel_id: string
  guild: {
    id: string
  }
  guild_id: string
  token: string
  type: number
}
