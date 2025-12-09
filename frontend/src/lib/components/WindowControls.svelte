<script lang="ts">
	import { Quit, WindowMinimise, WindowToggleMaximise } from '$lib/../../wailsjs/runtime/runtime';

	function minimize() {
		WindowMinimise();
	}

	function maximize() {
		WindowToggleMaximise();
	}

	function close() {
		Quit();
	}
</script>

<div class="flex items-center space-x-2 pl-3 ml-2 border-l border-slate-200 dark:border-slate-700 h-6">
	<button
		onclick={minimize}
		class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
		title="最小化"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
		</svg>
	</button>
	<button
		onclick={maximize}
		class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
		title="最大化"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
		</svg>
	</button>
	<button
		onclick={close}
		class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-red-500 dark:text-slate-400 dark:hover:text-white dark:hover:bg-red-600 transition-colors"
		title="关闭"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
