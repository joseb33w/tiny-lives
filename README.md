# 🏡 Tiny Lives

A cozy, low-poly **multiplayer 3D life-simulation** game for mobile and desktop browsers — a little "Sims world" you share with friends in real time. Built with **Three.js** and **Supabase Realtime**.

Pick a colour and a hat, step onto the lot, and share the room link to play together.

## ✨ Features
- **Real 3D, third-person** over-the-shoulder camera you can orbit by dragging.
- **Custom avatar** — choose a body colour and a hat (with a live 3D preview) before you join.
- **Four needs** with a mood face: Hunger, Energy, Fun and Social. They gently drain over time.
- **Interactions** — walk up to an object for a *Tap to…* prompt: cook & eat at the fridge/stove (Hunger), sleep in the bed (Energy), watch TV on the couch or play the arcade (Fun), tend the garden, or rest on the park bench. Your avatar sits / lies down / cooks while the need fills.
- **Live multiplayer** — see friends walking around with floating **name tags**, a **status icon** over their head (💤 / 🍳 / 📺 …), **emotes** (wave, dance, laugh, heart) and a **chat box** with speech bubbles. Standing near someone slowly fills both your Social needs.
- **Shareable rooms** — the room code is in the URL; send the link (or open a second tab) to land in the same world.
- **Cozy touches** — a gentle day/night cycle, soft ambient pad + birdsong, and a little pet that wanders the yard.

## 🎮 Controls
| | Desktop | Mobile |
|---|---|---|
| Move | WASD / arrow keys | left-side joystick |
| Look around | drag / mouse | drag on the right side |
| Interact | tap the prompt or **E** | tap the prompt |
| Emote | **1–4** or the 😄 button | 😄 button |
| Chat | **Enter** or 💬 | 💬 button |

## 🛠 Tech
- **Three.js** — low-poly flat-shaded models, soft shadows, CSS2D floating labels.
- **Supabase Realtime broadcast** — live player state, emotes and chat over a public channel keyed by the room code. Ephemeral: **no database tables, auth or RLS required**.
- **Vite** build, vanilla JS.

## 🚀 Local development
```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key
npm run dev
```
Build for production with `npm run build` (outputs to `dist/`).

## 🔐 Environment
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (Realtime endpoint) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
