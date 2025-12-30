<script lang="ts">
	import type { CheckInRecord, DefaultProjectResponse, ProjectItem, CheckInSubmitData } from '$lib/types';
	import Select from './Select.svelte';
	import ProjectSelect from './ProjectSelect.svelte';
	import { fetchProjectAddress } from '$lib/api';

	interface Props {
		record?: CheckInRecord | null;
		date: string;
		defaultProject?: DefaultProjectResponse | null;
		onSubmit: (data: CheckInSubmitData) => void;
		onBack?: () => void;
	}

	let { record = null, date, defaultProject = null, onSubmit, onBack }: Props = $props();

	// Form state
	let projectId = $state(record?.projectId || defaultProject?.every_day?.project_id?.toString() || '');
	let locationId = $state('');
	let officeId = $state('');
	let flybackId = $state('');
	let description = $state('');
	let approver = $state('');
	
	// Options state
	let locationOptions = $state<{ value: string; label: string }[]>([]); 
	let officeOptions = $state<{ value: string; label: string }[]>([]); 
	let flybackOptions = $state<{ value: string; label: string }[]>([]);
	
	// 监听 record 或 defaultProject 变化，更新表单
	$effect(() => {
		console.log('CheckInForm effect triggered', { hasRecord: !!record, hasDefault: !!defaultProject, currentProjectId: projectId });
		if (record) {
			projectId = record.projectId;
			// record currently has names, but we need IDs. 
			// If we can't recover IDs, we might have issues editing. 
			// For now, let's assume we are mostly creating or overwriting.
			// locationId = ???
			description = record.description;
		} else if (defaultProject && defaultProject.every_day) {
			// 如果是新表单且有默认项目
			const newProjId = defaultProject.every_day.project_id?.toString() || '';
			// Only update if project changed or form is empty/reset
			if (newProjId) {
				// Initialize if empty OR if it matches default (to ensure options are loaded)
				if (!projectId || projectId === newProjId) {
					projectId = newProjId;
					approver = defaultProject.every_day.approver || '未知';
					
					// Load default locations and flybacks
					handleProjectChange(newProjId, undefined, true);
					
					// Only reset description if it was empty
					if (!description) description = '';
				}
			}
		} else {
			// 重置
			projectId = '';
			locationId = '';
			officeId = '';
			flybackId = '';
			description = '';
			approver = '';
			locationOptions = [];
			officeOptions = [];
			flybackOptions = [];
		}
	});

	async function handleProjectChange(newProjectId: string, projectItem?: ProjectItem, isInit = false) {
		projectId = newProjectId;
		
		if (!newProjectId) {
			locationId = '';
			officeId = '';
			flybackId = '';
			approver = '';
			locationOptions = [];
			officeOptions = [];
			flybackOptions = [];
			return;
		}

		// Update approver if projectItem provided
		if (projectItem) {
			approver = projectItem.approver;
		}

		try {
			// 1. Set Location Options (Project Address from defaultProject/logic)
			if (defaultProject && defaultProject.every_day.project_id.toString() === newProjectId) {
				if (defaultProject.projaddress) {
					locationOptions = defaultProject.projaddress.map(addr => ({
						value: addr.address_id.toString(),
						label: addr.address_name
					}));
					// Default selected
					if (!isInit || !locationId) {
						const def = defaultProject.projaddress.find(a => a.selected_flag === 'Y');
						locationId = def ? def.address_id.toString() : (locationOptions[0]?.value || '');
					}
				}
			} else if (projectItem) {
				// Fallback for non-default project
				// projectItem doesn't have ID for address? 
				// fetch_projects response has prj_address_id and prj_address_name
				if (projectItem.prj_address_name) {
					const pid = projectItem.prj_address_id ? projectItem.prj_address_id.toString() : '0';
					locationOptions = [{
						value: pid,
						label: projectItem.prj_address_name
					}];
					locationId = pid;
				} else {
					locationOptions = [];
					locationId = '';
				}
			}

			// 2. Fetch Office Address (using fetchProjectAddress)
			const res = await fetchProjectAddress(parseInt(newProjectId));
			if (res && res.address_list) {
				officeOptions = res.address_list.map(addr => ({
					value: addr.address_id.toString(),
					label: addr.site_name
				}));

				// Set default office (prj_flag === 'Y')
				if (!isInit || !officeId) {
					const defaultAddr = res.address_list.find(addr => addr.prj_flag === 'Y');
					officeId = defaultAddr ? defaultAddr.address_id.toString() : (res.address_list[0]?.value?.toString() || (res.address_list[0] as any).address_id.toString() || '');
				}
			} else {
				officeOptions = [];
				officeId = '';
			}

			// 3. Set Flyback options
			if (defaultProject && defaultProject.every_day.project_id.toString() === newProjectId) {
				const flys = defaultProject.flyback || [];
				flybackOptions = flys.map(f => ({
					value: f.fly_id.toString(),
					label: f.fly_name
				}));
				
				if (!isInit || !flybackId) {
					const defFly = flys.find(f => f.fly_select === 'Y');
					flybackId = defFly ? defFly.fly_id.toString() : '';
				}
			} else {
				// Fallback options
				flybackOptions = [
					{ value: '-1', label: '无flyback' },
					{ value: '0', label: '有flyback' }
				];
				flybackId = '-1';
			}

		} catch (e) {
			console.error('Failed to load project details', e);
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		const locationName = locationOptions.find(o => o.value === locationId)?.label || '';
		const officeName = officeOptions.find(o => o.value === officeId)?.label || '';

		onSubmit({
			date,
			projectId,
			locationId,
			locationName,
			officeId,
			officeName,
			flybackId, 
			description,
			approver
		});
	}
</script>

<div class="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300 relative z-20">
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
				initialProjectName={defaultProject?.every_day?.project_name}
				onChange={(val, item) => handleProjectChange(val, item)}
				label="项目"
				placeholder="请选择项目"
			/>
		</div>

		<!-- 地点 -->
		<div>
			<label for="location" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				地点
			</label>
			<Select
				value={locationId}
				onChange={(val) => locationId = val as string}
				options={locationOptions}
				placeholder="选择地点"
			/>
		</div>

		<!-- 办公地点 -->
		<div>
			<label for="office" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				办公地点
			</label>
			<Select
				value={officeId}
				onChange={(val) => officeId = val as string}
				options={officeOptions}
				placeholder="选择办公地点"
			/>
		</div>

		<!-- 审批人和 Flyback (并排) -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					审批人
				</label>
				<div class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
					{approver || '未知'}
				</div>
			</div>
			<div>
				<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					Flyback
				</label>
				<Select
					value={flybackId}
					onChange={(val) => flybackId = val as string}
					options={flybackOptions}
					placeholder="选择 Flyback"
				/>
			</div>
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
