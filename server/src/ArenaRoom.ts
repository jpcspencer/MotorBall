import { Client, Room } from 'colyseus'
import { ArenaState, PlayerState } from './state.js'

type PlayerStateMessage = {
  x: number
  y: number
  rotation: number
  vx: number
  vy: number
}

const SPAWNS = [
  { x: -720, y: 0, rotation: 0 },
  { x: 720, y: 0, rotation: Math.PI },
  { x: 0, y: -390, rotation: Math.PI / 2 },
  { x: 0, y: 390, rotation: -Math.PI / 2 },
]

export class ArenaRoom extends Room<{ state: ArenaState }> {
  maxClients = 12

  onCreate() {
    this.setState(new ArenaState())
    this.setPatchRate(50)

    this.onMessage('playerState', (client, message: PlayerStateMessage) => {
      const player = this.state.players.get(client.sessionId)
      if (!player) {
        return
      }

      player.x = sanitizeNumber(message.x, player.x)
      player.y = sanitizeNumber(message.y, player.y)
      player.rotation = sanitizeNumber(message.rotation, player.rotation)
      player.vx = sanitizeNumber(message.vx, player.vx)
      player.vy = sanitizeNumber(message.vy, player.vy)
    })
  }

  onJoin(client: Client) {
    const spawn = SPAWNS[this.state.players.size % SPAWNS.length]
    const player = new PlayerState()
    player.x = spawn.x
    player.y = spawn.y
    player.rotation = spawn.rotation

    this.state.players.set(client.sessionId, player)
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
  }
}

function sanitizeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}
