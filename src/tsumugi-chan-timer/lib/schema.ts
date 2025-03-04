import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
  user: UserTable
  user_guild_channel: UserGuildChannelTable
}

type Immutable<T> = ColumnType<T, T, never>

export interface UserTable {
  id: Immutable<string> // Primary Key
  channels: string
  start: string
  all: number
}

export interface UserGuildChannelTable {
  id: Immutable<string> // Primary Key
  guild_id: Immutable<string>
  channel_id: string
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export type UserGuildChannel = Selectable<UserGuildChannelTable>
export type NewUserGuildChannel = Insertable<UserGuildChannelTable>
export type UserGuildChannelUpdate = Updateable<UserGuildChannelTable>
