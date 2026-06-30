# Motorball *(working title — open to change)*
 
A browser-based, real-time multiplayer arena game. Skate around a track with
weighted momentum, fight for control of a ball, score before someone bodychecks
it loose from you.
 
> **Status: early prototype / work in progress.**
> The name, the setting, and parts of the core design are all still up for grabs.
> "Motorball" is a placeholder codename (inspired by the cyborg track-sport in
> *Alita: Battle Angel*). Treat everything below as a current snapshot, not a
> contract. If the direction shifts, this file shifts with it.
 
---
 
## The idea (loosely held)
 
The feeling I'm chasing: **speed + contact, both happening at once.** You're
always moving, and the fight happens *while* you move — grab the ball, carry it,
and everyone else is allowed to hit you to take it.
 
What's intentionally undecided right now:
- The name and visual identity (grungy/industrial is the current lean, nothing locked)
- 2D top-down vs. an eventual 3D glow-up
- How combat actually feels (bump physics? abilities? both?)
- Whether this stays an arena sport or grows into something bigger
What I'm fairly confident about:
- Browser-first, instant-to-share via a link
- Real-time multiplayer is the core, not a feature bolted on later
- Momentum-based movement is the soul of it — it has to feel like carrying
  speed into a corner, never like sliding on ice
---
 
## Current state
 
Built so far (the foundation, deliberately before any "game"):
 
- A top-down arena: oval ring track drawn with primitives, outer + inner walls
- A player skater with **momentum-based movement** — thrust, steering, drag,
  max speed, wall collision
- Camera follows the local player
- **Real-time multiplayer sync**: open two browser tabs and each sees the
  other's skater move, with interpolation so remote players glide instead of
  teleporting
- Players are added/removed on connect/disconnect
No ball, no combat, no scoring yet — those are next. The multiplayer hook was
built first on purpose: it's the hardest piece, and everything else layers on
top of a foundation that already breathes.
 
---
 
## Tech stack
 
| Layer        | Choice                                  |
|--------------|-----------------------------------------|
| Client       | Vite + TypeScript + Phaser 3            |
| Server       | Colyseus (authoritative, TypeScript)    |
| Multiplayer  | Colyseus room (`ArenaRoom`) + schema state |
| Deploy (TBD) | Vercel for client, Node host for server |
 
Repo layout:
 
```
/client   → Vite + Phaser 3 front end
/server   → Colyseus multiplayer server
```
 
---
 
## Running it locally
 
You need two processes: the Colyseus server and the Vite client. From the repo
root, in two terminals:
 
```bash
# Terminal 1 — multiplayer server
cd server
npm install
npm run dev        # Colyseus, typically on http://localhost:2567
 
# Terminal 2 — game client
cd client
npm install
npm run dev        # Vite, typically on http://localhost:5173
```
 
Then open the **client** URL (the Vite one, usually `5173`) — open it in **two
tabs side by side** to test multiplayer sync. The server URL (`2567`) just shows
a Colyseus status page; that's normal, it's not the game.
 
> Exact ports and script names live in each folder's `package.json` — trust
> those over the numbers above if they differ.
 
**Controls:** `W` / `↑` thrust, `A`·`D` / `←`·`→` steer. (Subject to change.)
 
---
 
## Roadmap *(rough, reorderable)*
 
Each step is meant to be a small, self-contained session — no big-bang builds.
 
- [x] **v0 — Foundation:** momentum skating + 2-tab multiplayer sync
- [ ] **v1 — The ball:** spawn a ball, grab / carry / drop
- [ ] **v2 — Contact:** bumping/combat that can knock the ball loose
- [ ] **v3 — Scoring:** goals, laps, win condition
- [ ] **v4 — Characters:** distinct movement styles (heavy bruiser vs. fast
      lightweight, etc.)
- [ ] **vNext — Identity pass:** art direction, sound, the grime — the look that
      makes a 10-second clip pop
- [ ] **Someday:** lock the real name, decide 2D-forever vs. 3D glow-up
---
 
## Notes to self
 
- **The clip is the product.** A 10-second moment — a bodycheck that pops the
  ball loose, a collision at speed — is the thing worth recording and posting.
  Build toward moments that read instantly.
- **Art = direction, not generation.** Whatever assets get used, coherence is
  the whole game. One deliberate world beats fifteen mismatched styles.
- **Keep it joyful.** This is the downtime build. The day it starts feeling like
  an obligation, step back — it's allowed to just be fun.
---
 
## License
 
TBD.
 
