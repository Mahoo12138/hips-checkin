import { toastStore } from '$lib/components/toast';
import { GetToken } from '$lib/../../wailsjs/go/main/App';
import { goto } from '$app/navigation';

const BASE_URL = 'https://hippiusgw.hand-china.com';

interface RequestOptions extends RequestInit {
	params?: Record<string, string>;
	skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const { params, skipAuth, ...init } = options;

	let url = `${BASE_URL}${endpoint}`;
	if (params) {
		const searchParams = new URLSearchParams(params);
		url += `?${searchParams.toString()}`;
	}

	const headers = new Headers(init.headers);

	// Add Authorization
	if (!skipAuth) {
		try {
			// Check environment
			let token = '';
			if (typeof window !== 'undefined' && (window as any).go) {
				token = await GetToken();
			} else if (typeof localStorage !== 'undefined') {
				token = localStorage.getItem('access_token') || '';
			}
			
			if (token) {
				headers.set('Authorization', `bearer ${token}`);
			}
		} catch (e) {
			console.warn('Failed to retrieve token:', e);
		}
	}

	// Default headers if not multipart (fetch handles multipart boundary automatically if body is FormData)
	if (init.body && typeof init.body === 'object' && 
		!(init.body instanceof FormData) && 
		!(init.body instanceof URLSearchParams) &&
		!(init.body instanceof Blob)) {
		
		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json');
		}
		init.body = JSON.stringify(init.body);
	}

	const config: RequestInit = {
		...init,
		headers
	};

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			if (response.status === 401) {
				// Handle unauthorized
				if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
					toastStore.error('登录已过期，请重新登录');
					goto('/login');
				}
			}
			const errorText = await response.text();
			
			// Try parsing JSON error message
			let customErrorMsg = null;
			try {
				const errorJson = JSON.parse(errorText);
				if (errorJson && errorJson.message) {
					customErrorMsg = errorJson.message;
				}
			} catch (e) {
				// ignore parse error
			}

			if (customErrorMsg) {
				throw new Error(customErrorMsg);
			}

			throw new Error(`Request failed: ${response.status} ${errorText}`);
		}

		// Try parsing JSON
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			return response.json();
		}
		return response.text() as unknown as T;
	} catch (error: any) {
		console.error('API Request Error:', error);
		throw error;
	}
}

export const api = {
	get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
	post: <T>(endpoint: string, body: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'POST', body }),
	put: <T>(endpoint: string, body: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'PUT', body }),
	delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
