export interface LoginResponse {
	token: string;
	user: {
		id: string;
		phone: string;
		name: string;
	};
}

/**
 * 模拟登录接口
 * @param phone 手机号
 * @param password 密码
 * @returns Promise<LoginResponse>
 */
export async function login(phone: string, password: string): Promise<LoginResponse> {
	// 模拟网络延迟
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// 简单的模拟验证：只要手机号和密码不为空即可成功
	// 实际项目中这里会是真实的 API 请求
	if (!phone || !password) {
		throw new Error('手机号和密码不能为空');
	}

	// 模拟特定账号验证（可选，这里为了方便演示，任意非空都通过，但模拟一个特定用户数据）
	return {
		token: 'mock-token-' + Date.now(),
		user: {
			id: 'user-1',
			phone,
			name: '打卡用户'
		}
	};
}
