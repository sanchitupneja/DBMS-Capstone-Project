export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('onrender.com')) {
      return 'https://hostel-allocation-api-35k5.onrender.com/api';
    }
  }
  return 'http://localhost:5000/api';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
    const msg = isRender
      ? 'Cannot connect to the backend server. Render free services spin down after inactivity and take 40-50 seconds to wake up. Please wait a few seconds and try again!'
      : 'Network error: Unable to reach the API server. Please check your connection.';
    throw new Error(msg);
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned status ${response.status}. The backend may still be starting up, please try again in a moment.`);
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    const clearSession = () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    };

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearSession();
    } else {
      try {
        const refreshRes = await fetch(`${getApiBase()}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('accessToken', refreshData.data.accessToken);
          localStorage.setItem('refreshToken', refreshData.data.refreshToken);

          return request<T>(endpoint, options);
        }
        clearSession();
      } catch {
        clearSession();
      }
    }
  }

  return data;
}

export const authApi = {
  registerStudent: (data: Record<string, unknown>) =>
    request('/auth/register/student', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string; role?: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getMe: () => request('/auth/me'),

  refreshToken: (token: string) =>
    request('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken: token }) }),
};

export const hostelApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/hostels${qs}`);
  },
  get: (id: string) => request(`/hostels/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/hostels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/hostels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id: string) => request(`/hostels/${id}`, { method: 'DELETE' }),
  listRooms: (hostelId: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/hostels/${hostelId}/rooms${qs}`);
  },
  createRoom: (hostelId: string, data: Record<string, unknown>) =>
    request(`/hostels/${hostelId}/rooms`, { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (hostelId: string, roomId: string, data: Record<string, unknown>) =>
    request(`/hostels/${hostelId}/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (hostelId: string, roomId: string) =>
    request(`/hostels/${hostelId}/rooms/${roomId}`, { method: 'DELETE' }),
};

export const requestApi = {
  create: (data: Record<string, unknown>) =>
    request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/requests${qs}`);
  },
  get: (id: string) => request(`/requests/${id}`),
  cancel: (id: string) => request(`/requests/${id}/cancel`, { method: 'PATCH' }),
  process: (id: string, data: Record<string, unknown>) =>
    request(`/requests/${id}/process`, { method: 'PATCH', body: JSON.stringify(data) }),
  autoAllocate: (data: Record<string, unknown>) =>
    request('/requests/auto-allocate', { method: 'POST', body: JSON.stringify(data) }),
};

export const allocationApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/allocations${qs}`);
  },
  vacate: (id: string) => request(`/allocations/${id}/vacate`, { method: 'PATCH' }),
};

export const adminApi = {
  getDashboard: () => request('/admin/dashboard'),
  listStudents: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/admin/students${qs}`);
  },
};
