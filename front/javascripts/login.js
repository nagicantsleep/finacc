import 'bootstrap';

import { loadDictionaries } from './bilingual.js';
import ja from './locales/ja.json';
import vi from './locales/vi.json';
import en from './locales/en.json';

loadDictionaries({ ja, vi, en });

import Login from '../svelte/login.svelte';

const index = new Login({
    target: document.getElementById('index'),
});

export default index;
