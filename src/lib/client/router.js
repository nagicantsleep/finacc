import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export const currentPage = writable(typeof location !== 'undefined' ? location.pathname : '');

export const link = (href) => {
  if (typeof window !== 'undefined') {
    window.location.href = href;
  }
};

export const getStore = (key) => null;

export default { currentPage, link, getStore };
