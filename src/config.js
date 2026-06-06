export const NEEDS = ['hunger', 'energy', 'fun', 'social'];

export const NEED_META = {
  hunger: { label: 'Hunger', color: '#ff9a62', icon: '🍔' },
  energy: { label: 'Energy', color: '#7bd0ff', icon: '⚡' },
  fun: { label: 'Fun', color: '#c89bff', icon: '🎉' },
  social: { label: 'Social', color: '#ff8fb8', icon: '💬' },
};

// drain per second (0..1 scale). Gentle so the world stays cozy.
export const DRAIN = { hunger: 0.0042, energy: 0.0030, fun: 0.0050, social: 0.0038 };

// refill per second while interacting
export const REFILL = { hunger: 0.16, energy: 0.13, fun: 0.15, social: 0.05 };

export const SOCIAL_RANGE = 4.2; // metres within which two players share Social
export const MOVE_SPEED = 4.4;   // metres / second
export const TURN_SPEED = 10;    // body rotation lerp

export const NET_HZ = 11;        // state broadcasts per second (under the 10-15 rl)
export const REMOTE_TIMEOUT = 6000; // ms without an update -> remove remote

export const BODY_COLORS = [
  '#f08a8a', '#f7b267', '#f4d35e', '#8fd694',
  '#6ec6ff', '#9b8cff', '#ff9ed8', '#ffffff',
];

export const HATS = ['none', 'cap', 'party', 'flower', 'beanie'];

export const EMOTES = {
  wave:  { icon: '👋', label: 'Wave' },
  dance: { icon: '💃', label: 'Dance' },
  laugh: { icon: '😂', label: 'Laugh' },
  heart: { icon: '❤️', label: 'Heart' },
};

export const ACTION_ICON = {
  cook: '🍳', eat: '🍔', sleep: '💤', tv: '📺', arcade: '🕹️', garden: '🌱', bench: '🪑',
};

export function makeRoomCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += a[(Math.random() * a.length) | 0];
  return s;
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
