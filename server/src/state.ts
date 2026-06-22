import { MapSchema, Schema, defineTypes } from '@colyseus/schema'

export class PlayerState extends Schema {
  x = 0
  y = 0
  rotation = 0
  vx = 0
  vy = 0
}

defineTypes(PlayerState, {
  x: 'number',
  y: 'number',
  rotation: 'number',
  vx: 'number',
  vy: 'number',
})

export class ArenaState extends Schema {
  players = new MapSchema<PlayerState>()
}

defineTypes(ArenaState, {
  players: { map: PlayerState },
})
