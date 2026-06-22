import { MapSchema, Schema, defineTypes } from '@colyseus/schema'

export class PlayerState extends Schema {
  declare x: number
  declare y: number
  declare rotation: number
  declare vx: number
  declare vy: number

  constructor() {
    super()
    this.x = 0
    this.y = 0
    this.rotation = 0
    this.vx = 0
    this.vy = 0
  }
}

defineTypes(PlayerState, {
  x: 'number',
  y: 'number',
  rotation: 'number',
  vx: 'number',
  vy: 'number',
})

export class ArenaState extends Schema {
  declare players: MapSchema<PlayerState>

  constructor() {
    super()
    this.players = new MapSchema<PlayerState>()
  }
}

defineTypes(ArenaState, {
  players: { map: PlayerState },
})
