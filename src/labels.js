import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createLabel({ name = '', showName = true } = {}) {
  const el = document.createElement('div');
  el.className = 'tag';

  const bubble = document.createElement('div');
  bubble.className = 'tag-bubble';
  el.appendChild(bubble);

  const row = document.createElement('div');
  row.className = 'tag-row';
  const emote = document.createElement('div');
  emote.className = 'tag-emote';
  const status = document.createElement('div');
  status.className = 'tag-status';
  row.appendChild(emote);
  row.appendChild(status);
  el.appendChild(row);

  if (showName) {
    const nm = document.createElement('div');
    nm.className = 'tag-name';
    nm.textContent = name;
    el.appendChild(nm);
  }

  const object = new CSS2DObject(el);
  object.position.set(0, 2.15, 0);
  object.center.set(0.5, 1);

  let bubbleTimer = null;
  let emoteTimer = null;

  function setStatus(icon) {
    status.textContent = icon || '';
    status.style.display = icon ? 'flex' : 'none';
  }
  setStatus(null);

  function setBubble(text) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 5200);
  }

  function popEmote(icon) {
    emote.textContent = icon;
    emote.classList.remove('show');
    void emote.offsetWidth;
    emote.classList.add('show');
    clearTimeout(emoteTimer);
    emoteTimer = setTimeout(() => emote.classList.remove('show'), 2400);
  }

  function dispose() {
    clearTimeout(bubbleTimer);
    clearTimeout(emoteTimer);
    if (object.parent) object.parent.remove(object);
    el.remove();
  }

  return { object, setStatus, setBubble, popEmote, dispose };
}
