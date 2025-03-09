export const send_embed = async (
  channel_id: string,
  message: string,
  bot_token: string
) => {
  const url = `https://discord.com/api/v9/channels/${channel_id}/messages`

  const embed = {
    description: message,
    color: 0xb69f74
  }

  const payload = {
    embeds: [embed]
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${bot_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  return res
}
