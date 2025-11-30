<script lang="ts">
	import { toastStore, type Toast } from './toast';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	let toasts = $state<Toast[]>([]);

	// Subscribe to the store
	toastStore.subscribe(value => {
		toasts = value;
	});
</script>

<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
	{#each toasts as t (t.id)}
		<div
			animate:flip={{ duration: 300 }}
			transition:fly={{ y: -20, duration: 300 }}
			class="pointer-events-auto min-w-[300px] max-w-md bg-white dark:bg-slate-800 border rounded-xl shadow-lg p-4 flex items-start gap-3
			{t.type === 'success' ? 'border-green-200 dark:border-green-900' : ''}
			{t.type === 'error' ? 'border-red-200 dark:border-red-900' : ''}
			{t.type === 'info' ? 'border-blue-200 dark:border-blue-900' : ''}
			{t.type === 'warning' ? 'border-orange-200 dark:border-orange-900' : ''}
			"
		>
			<!-- Icon -->
			<div class="mt-0.5 shrink-0">
				{#if t.type === 'success'}
					<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
				{:else if t.type === 'error'}
					<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				{:else if t.type === 'warning'}
					<svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
				{:else}
					<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex-1">
				<p class="text-sm font-medium text-slate-800 dark:text-slate-200">{t.message}</p>
			</div>

			<!-- Close -->
			<button
				onclick={() => toastStore.remove(t.id)}
				class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>
	{/each}
</div>
