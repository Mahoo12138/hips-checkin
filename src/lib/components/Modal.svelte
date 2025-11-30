<script lang="ts">
	interface Props {
		isOpen: boolean;
		title?: string;
		onClose: () => void;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { isOpen, title, onClose, children, footer }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 z-[60] bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm transition-opacity"
		onclick={onClose}
		aria-hidden="true"
	></div>

	<!-- Modal Panel -->
	<div class="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
		<div 
			class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			{#if title}
				<div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
					<h3 class="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
					<button 
						onclick={onClose}
						class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="px-6 py-4 overflow-y-auto custom-scrollbar">
				{@render children?.()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end gap-3 shrink-0">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.5);
		border-radius: 20px;
	}
</style>
