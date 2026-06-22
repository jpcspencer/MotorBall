import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { ArenaRoom } from './ArenaRoom.js'

const PORT = Number(process.env.PORT ?? 2567)

const gameServer = new Server({
  transport: new WebSocketTransport({
    pingInterval: 5000,
    pingMaxRetries: 3,
  }),
})

gameServer.define('ArenaRoom', ArenaRoom)

await gameServer.listen(PORT)

console.log(`Motorball Colyseus server listening on ws://localhost:${PORT}`)
