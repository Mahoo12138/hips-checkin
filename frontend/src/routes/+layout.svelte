<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();
	let wailsStatus = $state('Checking...');
	let isWails = $state(false);

	onMount(() => {
		if ((window as any).go) {
			wailsStatus = 'Wails Runtime Loaded';
			isWails = true;
		} else {
			wailsStatus = 'Browser Mode (No Wails)';
			isWails = false;
		}
		console.log('[App] Wails Status:', wailsStatus, window.go);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
<ToastContainer />

<!-- Debug Indicator (Can be removed later) -->
{#if !isWails}
<div class="fixed bottom-1 left-1 z-[9999] bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300 opacity-75 pointer-events-none">
	{wailsStatus}
</div>
{/if}
