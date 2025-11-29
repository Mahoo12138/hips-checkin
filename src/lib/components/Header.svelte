<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		title?: string;
		user?: { name: string } | null;
		showBack?: boolean;
		onBack?: () => void;
		onLogout?: () => void;
	}

	let { title = '打卡助手', user = null, showBack = false, onBack, onLogout } = $props<Props>();
</script>

<header class="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 transition-colors duration-300">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
		<div class="flex items-center gap-3">
			{#if showBack && onBack}
				<button 
					class="md:hidden p-1 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
					onclick={onBack}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</button>
			{/if}
			
			<h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 truncate transition-all">
				{title}
			</h1>
		</div>

		<div class="flex items-center gap-2 sm:gap-4">
			<ThemeToggle />
			
			{#if user}
				<span class="hidden sm:block text-sm text-slate-600 dark:text-slate-400 font-medium">
					{user.name}
				</span>
				{#if onLogout}
					<button
						onclick={onLogout}
						class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
					>
						退出
					</button>
				{/if}
			{/if}
		</div>
	</div>
</header>
