# Goal
Build "Tiny Lives" — a cozy, low-poly multiplayer 3D life-simulation game that runs in mobile and desktop browsers. Players join a shared neighbourhood lot in real time, customise an avatar, manage four needs (Hunger, Energy, Fun, Social) by using objects around a little house, and socialise with friends via floating name tags, status icons, emotes and chat. The room code lives in the URL so sending a link drops a friend into the same world.

# Files to touch
- `index.html`, `src/style.css` — shell, start/customisation screen, HUD, on-screen controls.
- `src/main.js` — bootstrap + game loop.
- `src/world.js` — the 3D lot (house with kitchen/bedroom/living room, yard, garden, park bench), interactable objects and wall colliders.
- `src/avatar.js` — procedurally-animated low-poly avatar (idle/walk/sit/sleep/cook/emotes) plus hats.
- `src/localPlayer.js` — movement, third-person orbit camera, collisions, interactions, needs filling.
- `src/remotePlayers.js`, `src/labels.js` — other players' avatars + name tags, status icons, speech bubbles, emote pops.
- `src/needs.js` — four-need system + mood-face HUD.
- `src/input.js` — keyboard + dynamic touch joystick + drag-to-look.
- `src/net.js`, `src/supabaseClient.js` — Supabase Realtime broadcast multiplayer (state / emote / chat).
- `src/daynight.js`, `src/audio.js`, `src/pet.js` — gentle day/night cycle, ambient sound, a wandering pet.
- `src/ui.js`, `src/config.js` — start screen + controls, tunable constants.

# Verification approach
- Build with Vite.
- Node test: two `supabase-js` clients exchange `state` / `emote` / `chat` over Realtime broadcast against the real project.
- Headless Chromium (Playwright): join the world, WASD movement, proximity prompt near an object, need refilling while interacting, emotes, two browsers seeing each other live, Social need filling when players stand together, and a clean console. Screenshot key states.

# Out of scope
- Persistence / accounts — the shared world is ephemeral real-time state, so no Supabase tables/RLS are needed.
- Server-authoritative anti-cheat — multiplayer is client-authoritative (friends-play).
