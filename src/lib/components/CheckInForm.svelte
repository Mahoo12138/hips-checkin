<script lang="ts">
	import { PROJECTS, OFFICES, type CheckInRecord } from '$lib/data';

	interface Props {
		date: string;
		initialData?: CheckInRecord | null;
		onSave: (data: Omit<CheckInRecord, 'id' | 'submittedAt'>) => void;
	}

	let { date, initialData, onSave }: Props = $props();

	let projectId = $state('');
	let location = $state('中国大陆');
	let office = $state('');
	let hasFlyback = $state(false);
	let description = $state('');

	// 当日期或初始数据变化时更新表单
	$effect(() => {
		if (initialData) {
			projectId = initialData.projectId;
			location = initialData.location;
			office = initialData.office;
			hasFlyback = initialData.hasFlyback;
			description = initialData.description;
		} else {
			// 重置表单，保留一些默认值
			projectId = '';
			location = '中国大陆';
			office = '';
			hasFlyback = false;
			description = '';
		}
	});

	// 衍生状态：审批人
	const approver = $derived(PROJECTS.find(p => p.id === projectId)?.approver || '');

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSave({
			date,
			projectId,
			location,
			office,
			hasFlyback,
			description
		});
	}
</script>

<div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
	<div class="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
		<h2 class="text-xl font-bold text-slate-200">
			打卡详情
		</h2>
		<span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium border border-cyan-500/20">
			{date}
		</span>
	</div>

	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- 项目 -->
		<div>
			<label for="project" class="block text-sm font-medium text-slate-400 mb-1.5">项目</label>
			<div class="relative">
				<select
					id="project"
					bind:value={projectId}
					required
					class="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none appearance-none transition"
				>
					<option value="" disabled>请选择项目</option>
					{#each PROJECTS as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
				<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- 审批人 (只读) -->
			<div>
				<label for="approver" class="block text-sm font-medium text-slate-400 mb-1.5">审批人</label>
				<input
					type="text"
					id="approver"
					value={approver}
					readonly
					class="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 px-4 py-2.5 cursor-not-allowed outline-none"
					placeholder="自动带出"
				/>
			</div>

			<!-- Flyback -->
			<div>
				<label for="flyback" class="block text-sm font-medium text-slate-400 mb-1.5">Flyback</label>
				<div class="relative">
					<select
						id="flyback"
						bind:value={hasFlyback}
						class="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none appearance-none transition"
					>
						<option value={false}>无 Flyback</option>
						<option value={true}>有 Flyback</option>
					</select>
					<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
					</div>
				</div>
			</div>
		</div>

		<!-- 地点 -->
		<div>
			<label for="location" class="block text-sm font-medium text-slate-400 mb-1.5">地点</label>
			<input
				type="text"
				id="location"
				bind:value={location}
				required
				class="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition"
			/>
		</div>

		<!-- 办公地点 -->
		<div>
			<label for="office" class="block text-sm font-medium text-slate-400 mb-1.5">办公地点</label>
			<div class="relative">
				<select
					id="office"
					bind:value={office}
					required
					class="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none appearance-none transition"
				>
					<option value="" disabled>请选择办公地点</option>
					{#each OFFICES as o}
						<option value={o}>{o}</option>
					{/each}
				</select>
				<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</div>
			</div>
		</div>

		<!-- 描述 -->
		<div>
			<label for="description" class="block text-sm font-medium text-slate-400 mb-1.5">描述</label>
			<textarea
				id="description"
				bind:value={description}
				rows="3"
				class="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition resize-none"
				placeholder="请输入打卡备注..."
			></textarea>
		</div>

		<button
			type="submit"
			class="w-full py-3 rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
		>
			{initialData ? '更新打卡' : '提交打卡'}
		</button>
	</form>
</div>
