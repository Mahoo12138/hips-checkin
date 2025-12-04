<script lang="ts">
	import type { CheckInRecord, DefaultProjectResponse } from '$lib/types';
	import Select from './Select.svelte';
	import ProjectSelect from './ProjectSelect.svelte';

	interface Props {
		record?: CheckInRecord | null;
		date: string;
		defaultProject?: DefaultProjectResponse | null;
		onSubmit: (data: Omit<CheckInRecord, 'id' | 'submittedAt'>) => void;
		onBack?: () => void;
	}

	let { record = null, date, defaultProject = null, onSubmit, onBack }: Props = $props();

	// Form state
	let projectId = $state('');
	let location = $state('');
	let office = $state('');
	let hasFlyback = $state(false);
	let description = $state('');
	
	// 监听 record 或 defaultProject 变化，更新表单
	$effect(() => {
		if (record) {
			projectId = record.projectId;
			location = record.location;
			office = record.office;
			hasFlyback = record.hasFlyback;
			description = record.description;
		} else if (defaultProject && defaultProject.every_day) {
			// 如果是新表单且有默认项目
			projectId = defaultProject.every_day.project_id?.toString() || '';
			location = defaultProject.every_day.site_name || '';
			
			// 尝试从 projaddress 获取选中的 office，或者 fallback 到 site_name
			const selectedAddr = defaultProject.projaddress?.find((a: any) => a.selected_flag === 'Y');
			office = selectedAddr ? selectedAddr.address_name : (defaultProject.every_day.site_name || '');
			
			hasFlyback = false;
			description = '';
		} else {
			// 重置
			projectId = '';
			location = '';
			office = '';
			hasFlyback = false;
			description = '';
		}
	});

	// Mock options + Dynamic options from defaultProject
	// TODO: Load full lists from API
	let projectOptions = $derived.by(() => {
		const opts = [
			{ value: 'p1', label: '汉得内部项目-AIGC-产品研发中心-研发项目-2024' },
			{ value: 'p2', label: '汉得内部项目-亿砹科技-产品研发中心-HTMS运输管理研发项目-2025' },
			{ value: 'p3', label: '上海电氢智运机-2025' },
		];
		if (defaultProject && defaultProject.every_day && defaultProject.every_day.project_id) {
			const exists = opts.find(o => o.value === defaultProject!.every_day.project_id.toString());
			if (!exists) {
				opts.push({ 
					value: defaultProject.every_day.project_id.toString(), 
					label: defaultProject.every_day.project_name 
				});
			}
		}
		return opts;
	});
	
	let officeOptions = $derived.by(() => {
		const opts = [
			{ value: '上海办公室', label: '上海办公室' },
			{ value: '长沙交付中心(长沙市)', label: '长沙交付中心(长沙市)' },
		];
		// Add options from projaddress if available
		if (defaultProject && defaultProject.projaddress) {
			defaultProject.projaddress.forEach((addr: any) => {
				if (!opts.find(o => o.value === addr.address_name)) {
					opts.push({ value: addr.address_name, label: addr.address_name });
				}
			});
		}
		return opts;
	});

	// 衍生状态：审批人
	const approver = $derived(
		defaultProject?.every_day?.approver || '未知'
	);

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit({
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
			<ProjectSelect
				value={projectId}
				onChange={(val) => projectId = val}
				label="项目"
				placeholder="请选择项目"
			/>
		</div>

		<!-- 地点 -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="location" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					地点
				</label>
				<input
					type="text"
					id="location"
					bind:value={location}
					class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
					placeholder="输入地点"
				/>
			</div>
			<div>
				<label for="office" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					办公地点
				</label>
				<Select
					value={office}
					onChange={(val) => office = val as string}
					options={officeOptions}
					placeholder="选择办公地点"
				/>
			</div>
		</div>

		<!-- 审批人 (只读) -->
		<div>
			<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				审批人
			</label>
			<div class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
				{approver}
			</div>
		</div>

		<!-- Flyback -->
		<div class="flex items-center space-x-3">
			<input
				type="checkbox"
				id="flyback"
				bind:checked={hasFlyback}
				class="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
			/>
			<label for="flyback" class="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
				Flyback
			</label>
		</div>

		<!-- 描述 -->
		<div>
			<label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				工作描述
			</label>
			<textarea
				id="description"
				bind:value={description}
				rows="3"
				class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none"
				placeholder="输入工作内容..."
			></textarea>
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
			{#if onBack}
				<button
					type="button"
					onclick={onBack}
					class="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
				>
					返回
				</button>
			{/if}
			<button
				type="submit"
				class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
			>
				提交打卡
			</button>
		</div>
	</form>
</div>
