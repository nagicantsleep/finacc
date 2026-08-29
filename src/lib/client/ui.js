import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initial = browser ? localStorage.getItem('sidebar_collapsed') === 'true' : false;

export const sidebarCollapsed = writable(initial);

if (browser) {
  sidebarCollapsed.subscribe((val) => {
    try {
      localStorage.setItem('sidebar_collapsed', String(val));
    } catch (e) {
      // ignore local storage errors in private browsing
    }
  });
}
