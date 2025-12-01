import { api } from './utils/request';
import { encryptPassword, getDeviceID } from './utils/crypto';

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

		// 登录成功，返回统一格式
		// 由于 OAuth 接口通常只返回 Token，这里 Mock 用户信息
		// 实际场景可能需要调用 /api/user/me 获取用户信息
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
		// 如果是模拟环境且无法连接真实 API，可以考虑在这里 fallback 到 mock 逻辑
		// 但按照要求，我们实现的是"模拟登录过程"（即真实的请求逻辑），所以抛出真实错误
		throw e;
	}
}
