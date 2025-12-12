<script lang="ts">
	import type { CheckInRecord, DefaultProjectResponse, ProjectItem } from '$lib/types';
	import Select from './Select.svelte';
	import ProjectSelect from './ProjectSelect.svelte';
	import { fetchProjectAddress } from '$lib/api';

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
	let hasFlyback = $state('');
	let description = $state('');
	let approver = $state('');
	
	// Options state
	let locationOptions = $state<{ value: string; label: string }[]>([]); // This is now for "Location" (projaddress)
	let officeOptions = $state<{ value: string; label: string }[]>([]); // This is now for "Office Location" (fetchProjectAddress)
	let flybackOptions = $state<{ value: string; label: string }[]>([]);
	
	// 监听 record 或 defaultProject 变化，更新表单
	$effect(() => {
		if (record) {
			projectId = record.projectId;
			location = record.location;
			office = record.office;
			hasFlyback = record.hasFlyback ? 'Y' : 'N';
			description = record.description;
			// TODO: How to get approver for record?
		} else if (defaultProject && defaultProject.every_day) {
			// 如果是新表单且有默认项目
			projectId = defaultProject.every_day.project_id?.toString() || '';
			approver = defaultProject.every_day.approver || '未知';
			
			// Load default locations and flybacks
			if (projectId) {
				handleProjectChange(projectId, undefined, true);
			}
			
			description = '';
		} else {
			// 重置
			projectId = '';
			location = '';
			office = '';
			hasFlyback = '';
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
			location = '';
			office = '';
			hasFlyback = '';
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
			// According to requirement: Location comes from defaultProject.projaddress
			// If we are switching projects, we might not have the projaddress list for the NEW project unless we fetch defaultProject again or fetchProjects includes it?
			// Wait, fetchProjects returns ProjectItem which doesn't have projaddress list.
			// The only place we have projaddress list is in defaultProject response.
			// If the user selects a DIFFERENT project than default, we don't have its projaddress list readily available in client unless we fetch defaultProject for that specific project (which API supports? p_project_id?)
			// The fetchDefaultProject API takes p_employee, not project_id.
			// However, the requirement says "from project interface return projaddress array".
			// If the user selects a project from the Modal (fetchProjects), we only get ProjectItem.
			// Let's assume for now we use the projaddress from defaultProject if the IDs match, otherwise we might need another API call or fallback.
			// BUT, the instruction says "Location changed to Project Location, from project interface ... projaddress array".
			// If "project interface" refers to `fetch_projects`, let's check its response structure.
			// `fetch_projects` response (ProjectItem) has `prj_address_id` and `prj_address_name` but not a list.
			// `fetch_default_project` response has `projaddress` array.
			
			// Assuming we only have the full address list for the default project. 
			// If switching to a non-default project, we might only have single address from ProjectItem.
			
			if (defaultProject && defaultProject.every_day.project_id.toString() === newProjectId) {
				if (defaultProject.projaddress) {
					locationOptions = defaultProject.projaddress.map(addr => ({
						value: addr.address_name,
						label: addr.address_name
					}));
					// Default selected
					if (!isInit || !location) {
						const def = defaultProject.projaddress.find(a => a.selected_flag === 'Y');
						location = def ? def.address_name : (locationOptions[0]?.value || '');
					}
				}
			} else if (projectItem) {
				// Fallback for non-default project: use the address from projectItem
				if (projectItem.prj_address_name) {
					locationOptions = [{
						value: projectItem.prj_address_name,
						label: projectItem.prj_address_name
					}];
					location = projectItem.prj_address_name;
				} else {
					locationOptions = [];
					location = '';
				}
			}

			// 2. Fetch Office Address (using fetchProjectAddress)
			// This was previously "Location", now "Office Location"
			const res = await fetchProjectAddress(parseInt(newProjectId));
			if (res && res.address_list) {
				officeOptions = res.address_list.map(addr => ({
					value: addr.site_name,
					label: addr.site_name
				}));

				// Set default office (prj_flag === 'Y')
				if (!isInit || !office) {
					const defaultAddr = res.address_list.find(addr => addr.prj_flag === 'Y');
					office = defaultAddr ? defaultAddr.site_name : (res.address_list[0]?.site_name || '');
				}
			} else {
				officeOptions = [];
				office = '';
			}

			// 3. Set Flyback options
			if (defaultProject && defaultProject.every_day.project_id.toString() === newProjectId) {
				const flys = defaultProject.flyback || [];
				flybackOptions = flys.map(f => ({
					value: f.fly_id.toString(),
					label: f.fly_name
				}));
				
				if (!isInit || !hasFlyback) {
					const defFly = flys.find(f => f.fly_select === 'Y');
					hasFlyback = defFly ? defFly.fly_id.toString() : '';
				}
			} else {
				// Fallback options
				flybackOptions = [
					{ value: '-1', label: '无flyback' },
					{ value: '0', label: '有flyback' }
				];
				hasFlyback = '-1';
			}

		} catch (e) {
			console.error('Failed to load project details', e);
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit({
			date,
			projectId,
			location, // This is Project Address
			office,   // This is Office Address
			hasFlyback: hasFlyback !== '-1', 
			description
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
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="location" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					地点
				</label>
				<Select
					value={location}
					onChange={(val) => location = val as string}
					options={locationOptions}
					placeholder="选择地点"
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
		<div>
			<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				Flyback
			</label>
			<Select
				value={hasFlyback}
				onChange={(val) => hasFlyback = val as string}
				options={flybackOptions}
				placeholder="选择 Flyback"
			/>
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
