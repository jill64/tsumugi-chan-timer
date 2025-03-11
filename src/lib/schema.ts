import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
  user: UserTable
}

type Immutable<T> = ColumnType<T, T, never>

export interface UserTable {
  id: Immutable<string> // Primary Key
  channels: string
  start: string
  all: number
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>
