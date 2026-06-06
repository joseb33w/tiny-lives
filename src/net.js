import { supabase } from './supabaseClient.js';
import { REMOTE_TIMEOUT } from './config.js';

export class Net {
  constructor(roomCode, selfId) {
    this.room = roomCode;
    this.id = selfId;
    this.channel = null;
    this.connected = false;
    this.lastSeen = new Map();
    this.handlers = { state: null, emote: null, chat: null, leave: null };
    this._sweep = null;
  }

  on(event, cb) { this.handlers[event] = cb; return this; }

  async join() {
    const channel = supabase.channel(`tiny-lives-${this.room}`, {
      config: { broadcast: { self: false, ack: false } },
    });

    channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (!payload || payload.id === this.id) return;
      this.lastSeen.set(payload.id, performance.now());
      this.handlers.state && this.handlers.state(payload);
    });

    channel.on('broadcast', { event: 'emote' }, ({ payload }) => {
      if (!payload || payload.id === this.id) return;
      this.handlers.emote && this.handlers.emote(payload);
    });

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (!payload || payload.id === this.id) return;
      this.handlers.chat && this.handlers.chat(payload);
    });

    channel.on('broadcast', { event: 'bye' }, ({ payload }) => {
      if (!payload) return;
      this.lastSeen.delete(payload.id);
      this.handlers.leave && this.handlers.leave(payload.id);
    });

    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connected = true;
          resolve();
        }
      });
    });

    this.channel = channel;
    this._sweep = setInterval(() => this._sweepStale(), 1500);
    window.addEventListener('beforeunload', () => this.leave());
    return this;
  }

  _sweepStale() {
    const now = performance.now();
    for (const [id, t] of this.lastSeen) {
      if (now - t > REMOTE_TIMEOUT) {
        this.lastSeen.delete(id);
        this.handlers.leave && this.handlers.leave(id);
      }
    }
  }

  sendState(payload) {
    if (!this.connected) return;
    this.channel.send({ type: 'broadcast', event: 'state', payload });
  }

  sendEmote(emote) {
    if (!this.connected) return;
    this.channel.send({ type: 'broadcast', event: 'emote', payload: { id: this.id, emote } });
  }

  sendChat(name, text) {
    if (!this.connected) return;
    this.channel.send({ type: 'broadcast', event: 'chat', payload: { id: this.id, name, text } });
  }

  leave() {
    if (!this.channel) return;
    try { this.channel.send({ type: 'broadcast', event: 'bye', payload: { id: this.id } }); } catch (_) {}
    if (this._sweep) clearInterval(this._sweep);
    try { supabase.removeChannel(this.channel); } catch (_) {}
    this.channel = null;
    this.connected = false;
  }
}
