import './style.css'
import Phaser from 'phaser'
import { Client, getStateCallbacks, type Room } from 'colyseus.js'

type NetworkPlayer = {
  x: number
  y: number
  rotation: number
  vx: number
  vy: number
}

type ArenaState = {
  players: Map<string, NetworkPlayer>
}

type PlayerStateMessage = {
  x: number
  y: number
  rotation: number
  vx: number
  vy: number
}

const WORLD = {
  width: 2200,
  height: 1400,
  outerRx: 980,
  outerRy: 560,
  innerRx: 430,
  innerRy: 230,
  playerRadius: 18,
}

const SKATER = {
  thrust: 650,
  maxSpeed: 520,
  turnSpeed: 3.7,
  drag: 0.985,
}

class RemoteSkater {
  readonly sprite: Phaser.GameObjects.Graphics
  target: PlayerStateMessage

  constructor(scene: Phaser.Scene, color: number, state: NetworkPlayer) {
    this.sprite = createSkaterSprite(scene, color, 0xffffff)
    this.target = copyPlayerState(state)
    this.sprite.setPosition(state.x, state.y)
    this.sprite.setRotation(state.rotation)
  }
}

class ArenaScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private keys?: Record<'w' | 'a' | 'd', Phaser.Input.Keyboard.Key>
  private localSprite!: Phaser.GameObjects.Graphics
  private localId = ''
  private localState: PlayerStateMessage = { x: -720, y: 0, rotation: 0, vx: 0, vy: 0 }
  private room?: Room<ArenaState>
  private readonly remotes = new Map<string, RemoteSkater>()
  private statusText!: Phaser.GameObjects.Text

  constructor() {
    super('ArenaScene')
  }

  create() {
    this.cameras.main.setBackgroundColor(0x101218)
    this.cameras.main.setBounds(-WORLD.width / 2, -WORLD.height / 2, WORLD.width, WORLD.height)

    this.drawArena()

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'w' | 'a' | 'd', Phaser.Input.Keyboard.Key> | undefined

    this.localSprite = createSkaterSprite(this, 0x35d0ff, 0x101218)
    this.localSprite.setPosition(this.localState.x, this.localState.y)
    this.cameras.main.startFollow(this.localSprite, true, 0.12, 0.12)

    this.statusText = this.add
      .text(16, 16, 'Connecting to ArenaRoom...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#f5f7ff',
      })
      .setScrollFactor(0)
      .setDepth(10)

    void this.connect()
  }

  update(_time: number, deltaMs: number) {
    const delta = deltaMs / 1000
    this.updateLocalPlayer(delta)
    this.updateRemotePlayers(delta)
  }

  private async connect() {
    try {
      const endpoint = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:2567`
      const client = new Client(endpoint)
      this.room = await client.joinOrCreate<ArenaState>('ArenaRoom')
      this.localId = this.room.sessionId
      this.statusText.setText(`Connected: ${this.localId.slice(0, 6)}`)

      const $ = getStateCallbacks(this.room)

      $(this.room.state).players.onAdd((player, sessionId) => {
        if (sessionId === this.localId) {
          this.localState = copyPlayerState(player)
          this.localSprite.setPosition(player.x, player.y)
          this.localSprite.setRotation(player.rotation)
          return
        }

        const remote = new RemoteSkater(this, colorFromId(sessionId), player)
        this.remotes.set(sessionId, remote)

        $(player).onChange(() => {
          remote.target = copyPlayerState(player)
        })
      })

      $(this.room.state).players.onRemove((_player, sessionId) => {
        this.remotes.get(sessionId)?.sprite.destroy()
        this.remotes.delete(sessionId)
      })
    } catch (error) {
      console.error(error)
      this.statusText.setText('Could not connect to ws://localhost:2567')
    }
  }

  private drawArena() {
    const graphics = this.add.graphics()

    graphics.fillStyle(0x29313f, 1)
    graphics.fillEllipse(0, 0, WORLD.outerRx * 2, WORLD.outerRy * 2)

    graphics.lineStyle(28, 0xd8e2f0, 1)
    graphics.strokeEllipse(0, 0, WORLD.outerRx * 2, WORLD.outerRy * 2)

    graphics.fillStyle(0x101218, 1)
    graphics.fillEllipse(0, 0, WORLD.innerRx * 2, WORLD.innerRy * 2)

    graphics.lineStyle(24, 0xd8e2f0, 1)
    graphics.strokeEllipse(0, 0, WORLD.innerRx * 2, WORLD.innerRy * 2)

    graphics.lineStyle(4, 0x6f7f98, 0.7)
    graphics.strokeEllipse(0, 0, (WORLD.outerRx + WORLD.innerRx) * 1.04, (WORLD.outerRy + WORLD.innerRy) * 1.04)
  }

  private updateLocalPlayer(delta: number) {
    if (!this.keys || !this.cursors) {
      return
    }

    const turningLeft = this.keys.a.isDown || this.cursors.left.isDown
    const turningRight = this.keys.d.isDown || this.cursors.right.isDown

    if (turningLeft) {
      this.localState.rotation -= SKATER.turnSpeed * delta
    }

    if (turningRight) {
      this.localState.rotation += SKATER.turnSpeed * delta
    }

    if (this.keys.w.isDown || this.cursors.up.isDown) {
      this.localState.vx += Math.cos(this.localState.rotation) * SKATER.thrust * delta
      this.localState.vy += Math.sin(this.localState.rotation) * SKATER.thrust * delta
    }

    const speed = Math.hypot(this.localState.vx, this.localState.vy)
    if (speed > SKATER.maxSpeed) {
      const scale = SKATER.maxSpeed / speed
      this.localState.vx *= scale
      this.localState.vy *= scale
    }

    this.localState.vx *= Math.pow(SKATER.drag, delta * 60)
    this.localState.vy *= Math.pow(SKATER.drag, delta * 60)
    this.localState.x += this.localState.vx * delta
    this.localState.y += this.localState.vy * delta

    this.resolveTrackCollision()

    this.localSprite.setPosition(this.localState.x, this.localState.y)
    this.localSprite.setRotation(this.localState.rotation)

    this.room?.send('playerState', this.localState)
  }

  private updateRemotePlayers(delta: number) {
    const blend = 1 - Math.pow(0.001, delta)

    for (const remote of this.remotes.values()) {
      const currentRotation = remote.sprite.rotation
      remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.target.x, blend)
      remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.target.y, blend)
      remote.sprite.rotation = Phaser.Math.Angle.RotateTo(
        currentRotation,
        remote.target.rotation,
        blend * Math.PI,
      )
    }
  }

  private resolveTrackCollision() {
    const state = this.localState
    const outerRx = WORLD.outerRx - WORLD.playerRadius
    const outerRy = WORLD.outerRy - WORLD.playerRadius
    const innerRx = WORLD.innerRx + WORLD.playerRadius
    const innerRy = WORLD.innerRy + WORLD.playerRadius

    const outerNorm = ellipseNorm(state.x, state.y, outerRx, outerRy)
    if (outerNorm > 1) {
      const scale = 1 / Math.sqrt(outerNorm)
      state.x *= scale
      state.y *= scale
      dampVelocity(state, ellipseNormal(state.x, state.y, outerRx, outerRy), 1)
      return
    }

    const innerNorm = ellipseNorm(state.x, state.y, innerRx, innerRy)
    if (innerNorm < 1) {
      const scale = 1 / Math.sqrt(innerNorm || 0.0001)
      state.x *= scale
      state.y *= scale
      dampVelocity(state, ellipseNormal(state.x, state.y, innerRx, innerRy), -1)
    }
  }
}

function createSkaterSprite(scene: Phaser.Scene, color: number, indicatorColor: number) {
  const graphics = scene.add.graphics()
  graphics.fillStyle(color, 1)
  graphics.fillCircle(0, 0, WORLD.playerRadius)
  graphics.lineStyle(4, indicatorColor, 1)
  graphics.lineBetween(0, 0, WORLD.playerRadius + 12, 0)
  graphics.fillStyle(indicatorColor, 1)
  graphics.fillTriangle(WORLD.playerRadius + 18, 0, WORLD.playerRadius + 6, -7, WORLD.playerRadius + 6, 7)
  return graphics
}

function ellipseNorm(x: number, y: number, rx: number, ry: number) {
  return (x * x) / (rx * rx) + (y * y) / (ry * ry)
}

function ellipseNormal(x: number, y: number, rx: number, ry: number) {
  const nx = x / (rx * rx)
  const ny = y / (ry * ry)
  const length = Math.hypot(nx, ny) || 1
  return { x: nx / length, y: ny / length }
}

function dampVelocity(state: PlayerStateMessage, normal: { x: number; y: number }, blockedDirection: 1 | -1) {
  const intoWall = state.vx * normal.x + state.vy * normal.y

  if (intoWall * blockedDirection > 0) {
    state.vx -= intoWall * normal.x
    state.vy -= intoWall * normal.y
  } else {
    state.vx *= 0.7
    state.vy *= 0.7
  }
}

function copyPlayerState(state: NetworkPlayer): PlayerStateMessage {
  return {
    x: state.x,
    y: state.y,
    rotation: state.rotation,
    vx: state.vx,
    vy: state.vy,
  }
}

function colorFromId(id: string) {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return Phaser.Display.Color.HSVColorWheel()[hash % 360].color
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
  },
  scene: ArenaScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
})
