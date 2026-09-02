import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const MOBILE_BP = 768;
const STORAGE_KEY = 'sidebar_collapsed';

function isMobileViewport() {
  return browser && window.innerWidth < MOBILE_BP;
}

function readDesktopPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function writeDesktopPref(val) {
  try {
    localStorage.setItem(STORAGE_KEY, String(val));
  } catch (e) {
    // ignore local storage errors in private browsing
  }
}

const initial = browser
  ? (isMobileViewport() ? true : readDesktopPref())
  : false;

export const sidebarCollapsed = writable(initial);

if (browser) {
  sidebarCollapsed.subscribe((val) => {
    if (!isMobileViewport()) {
      writeDesktopPref(val);
    }
  });

  let wasMobile = isMobileViewport();
  window.addEventListener('resize', () => {
    const mobile = isMobileViewport();
    if (mobile === wasMobile) return;
    wasMobile = mobile;
    if (mobile) {
      sidebarCollapsed.set(true);
    } else {
      sidebarCollapsed.set(readDesktopPref());
    }
  });
}
