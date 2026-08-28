import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export const currentPage = writable(typeof location !== 'undefined' ? location.pathname : '');

export const link = (href) => {
  if (typeof window !== 'undefined') {
    currentPage.set(href);
    goto(href).catch(() => {
      window.location.href = href;
    });
  }
};

export const getStore = (key) => null;

export default { currentPage, link, getStore };
