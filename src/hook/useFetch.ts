import { useState, useCallback } from 'my-react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions<TBody = unknown> {
	method?: HttpMethod;
	body?: TBody;
	headers?: Record<string, string>;
}

interface FetchResult<T> {
	data: T | null;
	error: string | null;
	loading: boolean;
}

interface UseFetchReturn<T> {
	data: T | null;
	error: string | null;
	loading: boolean;
	execute: () => Promise<T | null>;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = (async () => {
		try {
			const response = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include',
			});
			return response.ok;
		} catch {
			return false;
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

async function fetchWithAuth<T>(
	url: string,
	options: RequestInit = {},
	retried = false,
): Promise<{ data: T | null; error: string | null }> {
	const fetchOptions: RequestInit = {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	};

	try {
		const response = await fetch(url, fetchOptions);

		if (response.status === 401 && !retried) {
			const refreshed = await refreshToken();

			if (refreshed) {
				return fetchWithAuth<T>(url, options, true);
			}

			window.location.href = '/login';
			return { data: null, error: 'Session expired. Please login again.' };
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
			return { data: null, error: errorData.message || `HTTP ${response.status}` };
		}

		const text = await response.text();
		if (!text) {
			return { data: null, error: null };
		}

		const data = JSON.parse(text) as T;
		return { data, error: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error';
		return { data: null, error: message };
	}
}

export function useFetch<T>(url: string, options?: FetchOptions): UseFetchReturn<T> {
	const [state, setState] = useState<FetchResult<T>>({
		data: null,
		error: null,
		loading: false,
	});

	const execute = useCallback(async (): Promise<T | null> => {
		setState((prev) => ({ ...prev, loading: true, error: null }));

		const fetchOptions: RequestInit = {
			method: options?.method || 'GET',
			headers: options?.headers,
		};

		if (options?.body) {
			fetchOptions.body = JSON.stringify(options.body);
		}

		const result = await fetchWithAuth<T>(url, fetchOptions);

		setState({
			data: result.data,
			error: result.error,
			loading: false,
		});

		return result.data;
	}, [url, options?.method, options?.body, options?.headers]);

	return {
		...state,
		execute,
	};
}

export const api = {
	async get<T>(url: string): Promise<{ data: T | null; error: string | null }> {
		return fetchWithAuth<T>(url, { method: 'GET' });
	},

	async post<T, TBody = unknown>(
		url: string,
		body?: TBody,
	): Promise<{ data: T | null; error: string | null }> {
		return fetchWithAuth<T>(url, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
		});
	},

	async put<T, TBody = unknown>(
		url: string,
		body?: TBody,
	): Promise<{ data: T | null; error: string | null }> {
		return fetchWithAuth<T>(url, {
			method: 'PUT',
			body: body ? JSON.stringify(body) : undefined,
		});
	},

	async delete<T>(url: string): Promise<{ data: T | null; error: string | null }> {
		return fetchWithAuth<T>(url, { method: 'DELETE' });
	},

	async patch<T, TBody = unknown>(
		url: string,
		body?: TBody,
	): Promise<{ data: T | null; error: string | null }> {
		return fetchWithAuth<T>(url, {
			method: 'PATCH',
			body: body ? JSON.stringify(body) : undefined,
		});
	},
};

