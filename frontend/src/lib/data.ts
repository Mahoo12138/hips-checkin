export interface Project {
	id: string;
	name: string;
	approver: string;
}

// 旧的本地记录结构（为了兼容或后续迁移，先保留，或者稍后统一）
export interface CheckInRecord {
	id: string;
	date: string; // YYYY-MM-DD
	projectId: string;
	location: string;
	office: string;
	hasFlyback: boolean;
	description: string;
	submittedAt: number;
}

// 新增：后端接口返回的数据结构
export interface TimeSheetRecord {
	status: 'Empty' | 'Draft' | 'Approved' | 'Rejected';
	lockflag: string; // "0" | "1"
	each_day: string; // "YYYYMMDD"
	enable: 'Y' | 'N';
	day: string; // "DD"
	proj: string;
	allowance: string;
}

export interface TimeSheetResponse {
	timesheet: TimeSheetRecord[];
	month: string; // "YYYYMM"
	allowance_query: string;
	status: string;
	message: string;
	allowance_type: string;
	allowance_type_name: string;
	company_status: string;
	button_status: string;
	update_status: string;
	con_status: string;
}

export const PROJECTS: Project[] = [
	{ id: 'p1', name: '研发项目 - 基础平台', approver: '张三' },
	{ id: 'p2', name: '研发项目 - 移动端', approver: '李四' },
	{ id: 'p3', name: '内部培训', approver: '王五' },
	{ id: 'p4', name: '甲方项目 - A公司', approver: '赵六' },
	{ id: 'p5', name: '甲方项目 - B银行', approver: '钱七' },
	{ id: 'p6', name: '上海电氢智运机', approver: '刘八' }, // 对应 mock 数据
	{ id: 'p7', name: '法定假日', approver: '系统' },
	{ id: 'p8', name: '个人休假-带薪', approver: '系统' }
];

export const OFFICES = [
	'长沙办公室',
	'上海办公室',
	'北京办公室',
	'深圳办公室',
	'居家办公',
	'客户现场'
];
