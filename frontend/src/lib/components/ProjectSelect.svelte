<script lang="ts">
	import Modal from './Modal.svelte';
	import Tabs from './Tabs.svelte';
	import type { ProjectItem } from '$lib/types';
	import { fetchProjects } from '$lib/api';
	import { userStore } from '$lib/stores';

	interface Props {
		value: string; // project_id
		onChange: (val: string, project?: ProjectItem) => void;
		placeholder?: string;
		label?: string;
		disabled?: boolean;
	}

	let { value = $bindable(), onChange, placeholder = '请选择项目', label, disabled = false }: Props = $props();

	let isModalOpen = $state(false);
	let isLoading = $state(false);
	let projects = $state<ProjectItem[]>([]);
	let error = $state<string | null>(null);

	// Tab state
	let tabs = $state<{ id: string; label: string }[]>([]);
	let activeTabId = $state('');

	// Selection state within modal
	let tempSelectedProjectId = $state('');
	let tempSelectedProject = $state<ProjectItem | null>(null);

	// Search state
	let searchQuery = $state('');

	// Derived state
	let selectedLabel = $derived(
		projects.find(p => p.project_id.toString() === value)?.project_name || 
		value || // Fallback to showing ID if name not found yet
		''
	);

	let filteredProjects = $derived.by(() => {
		let list = projects;
		
		// Filter by Tab
		if (activeTabId) {
			list = list.filter(p => p.project_type === activeTabId);
		}

		// Filter by Search
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(p => 
				p.project_name.toLowerCase().includes(q) || 
				p.project_code.toLowerCase().includes(q)
			);
		}

		return list;
	});

	async function loadProjects() {
		if (projects.length > 0) return;

		const user = $userStore;
		if (!user || !user.employeeNum) {
			error = '未找到用户信息，无法加载项目';
			return;
		}

		isLoading = true;
		error = null;
		try {
			const res = await fetchProjects(user.employeeNum);
			if (res && res.project) {
				projects = res.project;
				
				// Generate tabs from unique project types
				const types = new Set(projects.map(p => p.project_type));
				tabs = Array.from(types).map(t => ({ id: t, label: t }));
				if (tabs.length > 0) {
					activeTabId = tabs[0].id;
				}
			}
		} catch (e: any) {
			console.error(e);
			error = e.message || '加载项目失败';
		} finally {
			isLoading = false;
		}
	}

	function openModal() {
		if (disabled) return;
		isModalOpen = true;
		tempSelectedProjectId = value;
		tempSelectedProject = projects.find(p => p.project_id.toString() === value) || null;
		loadProjects();
	}

	function closeModal() {
		isModalOpen = false;
		searchQuery = '';
	}

	function handleSelect(project: ProjectItem) {
		tempSelectedProjectId = project.project_id.toString();
		tempSelectedProject = project;
	}

	function handleConfirm() {
		if (tempSelectedProjectId) {
			value = tempSelectedProjectId;
			onChange(value, tempSelectedProject || undefined);
		}
		closeModal();
	}
</script>

<div>
	{#if label}
		<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
			{label}
		</label>
	{/if}
	
	<button
		type="button"
		onclick={openModal}
		{disabled}
		class="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-left transition-all
		{isModalOpen ? 'ring-2 ring-cyan-500/50 border-cyan-500' : ''}
		{disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50'}
		"
	>
		{#if value}
			<span class="text-slate-900 dark:text-slate-200 block truncate flex-1 mr-2">{selectedLabel}</span>
		{:else}
			<span class="text-slate-400 dark:text-slate-500 block truncate flex-1 mr-2">{placeholder}</span>
		{/if}
		
		<div class="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-slate-500 dark:text-slate-400">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
	</button>

	<Modal
		isOpen={isModalOpen}
		title="选择项目"
		onClose={closeModal}
	>
		<div class="flex flex-col h-[60vh]">
			<!-- Search -->
			<div class="mb-4">
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
						placeholder="搜索项目名称或编码..."
					/>
				</div>
			</div>

			<!-- Tabs -->
			<div class="mb-4">
				{#if isLoading && tabs.length === 0}
					<div class="animate-pulse h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
				{:else if tabs.length > 0}
					<Tabs 
						items={tabs} 
						activeId={activeTabId} 
						onChange={(id) => activeTabId = id} 
					/>
				{/if}
			</div>

			<!-- List -->
			<div class="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
				{#if isLoading}
					<div class="space-y-3 py-2">
						{#each Array(5) as _}
							<div class="animate-pulse flex space-x-4">
								<div class="rounded-full bg-slate-200 dark:bg-slate-700 h-10 w-10"></div>
								<div class="flex-1 space-y-2 py-1">
									<div class="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
									<div class="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if error}
					<div class="flex flex-col items-center justify-center h-full text-red-500">
						<svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
						<p>{error}</p>
						<button onclick={loadProjects} class="mt-4 text-cyan-600 hover:underline">重试</button>
					</div>
				{:else if filteredProjects.length === 0}
					<div class="flex flex-col items-center justify-center h-full text-slate-400">
						<p>未找到相关项目</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each filteredProjects as project}
							<button
								type="button"
								onclick={() => handleSelect(project)}
								class="w-full text-left p-3 rounded-xl border transition-all duration-200 group
								{tempSelectedProjectId === project.project_id.toString()
									? 'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-500/50 shadow-sm' 
									: 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-cyan-500/30 hover:shadow-sm'}"
							>
								<div class="flex justify-between items-start">
									<div>
										<div class="font-medium text-slate-900 dark:text-slate-200 mb-1 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
											{project.project_name}
										</div>
										<div class="text-xs text-slate-500 dark:text-slate-400 font-mono">
											{project.project_code}
										</div>
									</div>
									{#if tempSelectedProjectId === project.project_id.toString()}
										<div class="text-cyan-500">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
										</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 shrink-0">
				<button
					type="button"
					onclick={closeModal}
					class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
				>
					取消
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={!tempSelectedProjectId}
					class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					确认
				</button>
			</div>
		</div>
	</Modal>
</div>
