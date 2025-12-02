<script lang="ts">
	import { PROJECTS, OFFICES, type CheckInRecord } from '$lib/data';
	import Select from './Select.svelte';

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

<div class="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
	<div class="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
		<h2 class="text-xl font-bold text-slate-800 dark:text-slate-200">
			打卡详情
		</h2>
		<span class="px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-medium border border-cyan-200 dark:border-cyan-500/20">
			{date}
		</span>
	</div>

	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- 项目 -->
		<div>
			<Select
				label="项目"
				bind:value={projectId}
				options={PROJECTS.map(p => ({ value: p.id, label: p.name }))}
				required
				placeholder="请选择项目"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- 审批人 (只读) -->
			<div>
				<label for="approver" class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">审批人</label>
				<input
					type="text"
					id="approver"
					value={approver}
					readonly
					class="w-full rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 px-4 py-2.5 cursor-not-allowed outline-none"
					placeholder="自动带出"
				/>
			</div>

			<!-- Flyback -->
			<div>
				<Select
					label="Flyback"
					bind:value={hasFlyback}
					options={[
						{ value: false, label: '无 Flyback' },
						{ value: true, label: '有 Flyback' }
					]}
				/>
			</div>
		</div>

		<!-- 地点 -->
		<div>
			<label for="location" class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">地点</label>
			<input
				type="text"
				id="location"
				bind:value={location}
				required
				class="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition"
			/>
		</div>

		<!-- 办公地点 -->
		<div>
			<Select
				label="办公地点"
				bind:value={office}
				options={OFFICES.map(o => ({ value: o, label: o }))}
				required
				placeholder="请选择办公地点"
			/>
		</div>

		<!-- 描述 -->
		<div>
			<label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">描述</label>
			<textarea
				id="description"
				bind:value={description}
				rows="3"
				class="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition resize-none"
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
