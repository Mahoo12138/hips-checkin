import { api } from './utils/request';
import { encryptPassword, getDeviceID } from './utils/crypto';
import { SaveToken, GetToken, DeleteToken } from '$lib/../../wailsjs/go/main/App';
import type { UserInfo, ProjectInfo, CalendarResponse, DefaultProjectResponse, FetchProjectsResponse } from './types';

// Safe wrappers for Wails calls to support browser dev
const safeSaveToken = async (token: string) => {
	if (typeof window !== 'undefined' && (window as any).go) {
		return await SaveToken(token);
	}
	console.warn('Wails runtime not available, falling back to localStorage');
	localStorage.setItem('access_token', token);
};

export const getToken = async () => {
	if (typeof window !== 'undefined' && (window as any).go) {
		return await GetToken();
	}
	console.warn('Wails runtime not available, reading from localStorage');
	return localStorage.getItem('access_token') || '';
};

const safeDeleteToken = async () => {
	if (typeof window !== 'undefined' && (window as any).go) {
		return await DeleteToken();
	}
	console.warn('Wails runtime not available, clearing localStorage');
	localStorage.removeItem('access_token');
};

export interface LoginResponse {
	token: string;
	user: {
		id: string;
		phone: string;
		name: string;
	};
}

interface OAuthTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	// ...
}

/**
 * 登录接口
 * @param phone 手机号
 * @param password 密码
 * @returns Promise<LoginResponse>
 */
export async function login(phone: string, password: string): Promise<LoginResponse> {
	if (!phone || !password) {
		throw new Error('手机号和密码不能为空');
	}

	// Format username (prepend +86- if not present, simple check)
	const username = phone.startsWith('+86-') ? phone : `+86-${phone}`;
	
	const encryptedPassword = encryptPassword(password);
	const deviceId = getDeviceID();

	const formData = new FormData();
	formData.append('username', username);
	formData.append('password', encryptedPassword);
	formData.append('device_id', deviceId);

	const params = {
		client_id: 'client',
		client_secret: 'secret',
		grant_type: 'password',
		source_type: 'app'
	};

	try {
		const res = await api.post<OAuthTokenResponse>('/oauth/oauth/token', formData, {
			params,
			skipAuth: true
		});

		// Securely save token
		await safeSaveToken(res.access_token);

		// 登录成功，返回统一格式
		return {
			token: res.access_token,
			user: {
				id: 'user-' + username, // 暂用 username 作为 ID
				phone: phone,
				name: '打卡用户' // 暂无名字
			}
		};
	} catch (e: any) {
		console.error('Login failed:', e);
		throw e;
	}
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
	const token = await getToken();
	const deviceId = getDeviceID();

	if (!token) return;

	try {
		await api.get(`/hipspfm/hippius/v1/users/logout/${token}`, {
			params: { deviceId }
		});
	} catch (e) {
		console.warn('Logout API call failed, clearing local state anyway:', e);
	} finally {
		await safeDeleteToken();
	}
}

/**
 * Helper for wrapped requests (HANDMOBILE interface)
 */
async function invokeHandMobileApi<T>(interfaceCode: string, params: any): Promise<T> {
	const payload = JSON.stringify({ params });
	const res = await api.post<any>(`/hitf/v1/rest/invoke?namespace=HAND&serverCode=HANDMOBILE&interfaceCode=${interfaceCode}`, {
		headerParamMap: null,
		pathVariableMap: null,
		requestParamMap: null,
		payload
	});
	
	if (res && res.payload) {
		return JSON.parse(res.payload) as T;
	}
	throw new Error(`Failed to invoke ${interfaceCode}: Invalid response payload`);
}

/**
 * 获取用户信息 (userSelfInfo)
 */
export async function fetchUserInfo(): Promise<any> {
	return api.get<any>('/hipspfm/hippius/v1/users/userSelfInfo');
}

/**
 * 获取用户详情 (contact/detailV2)
 */
export async function fetchUserDetail(): Promise<UserInfo> {
	// Note: The API returns an array, we take the first element
	const res = await api.get<any[]>('/hipspfm/hippius/v1/contact/detailV2');
	
	if (!res || res.length === 0) {
		throw new Error('No user detail found');
	}

	const detail = res[0];
	const props = detail.propertyList || [];
	
	const getValue = (key: string) => {
		const prop = props.find((p: any) => p.propertyKey === key);
		return prop?.propertyValue?.[0]?.name || '';
	};

	return {
		id: detail.employeeId,
		loginName: getValue('工号'), 
		realName: getValue('姓名'),
		phone: getValue('手机号'),
		email: getValue('邮箱'),
		employeeNum: getValue('工号'),
		unitName: getValue('部门'),
		positionName: getValue('职位'),
		avatarUrl: detail.orgLogoUrl
	};
}

/**
 * 获取默认项目
 */
export async function fetchDefaultProject(employeeNum: string, dateStr?: string): Promise<DefaultProjectResponse> {
	if (!dateStr) {
		const now = new Date();
		dateStr = now.getFullYear() + 
			(now.getMonth() + 1).toString().padStart(2, '0') + 
			now.getDate().toString().padStart(2, '0');
	}

	return invokeHandMobileApi<DefaultProjectResponse>('fetch_default_projects', {
		p_employee: employeeNum,
		p_date: dateStr,
		p_longitude: "112.859364", 
		p_latitude: "28.238764",
		p_language: "zh_CN"
	});
}

/**
 * 获取项目列表
 */
export async function fetchProjects(employeeNum: string, dateStr?: string): Promise<FetchProjectsResponse> {
	if (!dateStr) {
		const now = new Date();
		dateStr = now.getFullYear() + 
			(now.getMonth() + 1).toString().padStart(2, '0') + 
			now.getDate().toString().padStart(2, '0');
	}

	return invokeHandMobileApi<FetchProjectsResponse>('fetch_projects', {
		p_employee: employeeNum,
		p_date: dateStr,
		p_longitude: "112.859364", 
		p_latitude: "28.238764", 
		p_language: "zh_CN"
	});
}

/**
 * 获取日历数据
 */
export async function fetchCalendar(employeeNum: string, month: string): Promise<CalendarResponse> {
	return invokeHandMobileApi<CalendarResponse>('fetch_calendar', {
		p_employee: employeeNum,
		p_month: month,
		p_offset: 0,
		p_language: "zh_CN"
	});
}
