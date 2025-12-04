import { writable } from 'svelte/store';
import type { UserInfo } from './types';

function createPersistentStore<T>(key: string, startValue: T) {
	const { subscribe, set, update } = writable<T>(startValue);

	return {
		subscribe,
		set: (value: T) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(key, JSON.stringify(value));
			}
			set(value);
		},
		update,
		init: () => {
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem(key);
				if (stored) {
					try {
						set(JSON.parse(stored));
					} catch (e) {
						console.error('Failed to parse stored value for', key, e);
					}
				}
			}
		}
	};
}

export const userStore = createPersistentStore<UserInfo | null>('user_info', null);
