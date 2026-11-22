import { useSyncExternalStore } from 'react';
import { discoveryLinks, type Discovery } from '@/features/discoveries/catalog';

const storageKey = 'facodi.discoveries.v1';
const changedEvent = 'facodi:discoveries';
const known = new Set<string>(discoveryLinks.map(({ id }) => id));
const empty = '[]';
let memory = empty;
let storageBlocked = false;

function read() {
  if (storageBlocked) return memory;
  try {
    return window.localStorage.getItem(storageKey) ?? empty;
  } catch {
    return memory;
  }
}

function parse(value: string): Set<Discovery> {
  try {
    const items: unknown = JSON.parse(value);
    return new Set(Array.isArray(items) ? items.filter((id): id is Discovery => typeof id === 'string' && known.has(id)) : []);
  } catch {
    return new Set();
  }
}

function subscribe(notify: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) notify();
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(changedEvent, notify);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changedEvent, notify);
  };
}

export function rememberDiscovery(id: Discovery) {
  const found = parse(read());
  if (found.has(id)) return false;
  found.add(id);
  memory = JSON.stringify([...found]);
  try {
    window.localStorage.setItem(storageKey, memory);
  } catch {
    storageBlocked = true;
  }
  window.dispatchEvent(new Event(changedEvent));
  return true;
}

export function useDiscoveries() {
  return parse(useSyncExternalStore(subscribe, read, () => empty));
}
