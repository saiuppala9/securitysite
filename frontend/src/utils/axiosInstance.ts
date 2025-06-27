import axios from 'axios';

// This is a temporary workaround to bypass persistent TypeScript errors with axios.
// We will use 'any' to avoid type checking issues for now.

// Function to get CSRF token from cookies
function getCookie(name: string): string | null {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export const baseURL = 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Important for sending cookies
});

// Add access token and CSRF token to every request
axiosInstance.interceptors.request.use(
    (config: any) => {
        const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
        if (tokens?.access) {
            config.headers.Authorization = `Bearer ${tokens.access}`;
        }

        // Check if we're sending FormData (file upload)
        // If so, let the browser set the Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);

// Handle token expiration and refresh
axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        const originalRequest = error.config;
        originalRequest._retry = originalRequest._retry || false;

        if (error.response?.status === 401 && originalRequest.url !== '/auth/jwt/refresh/' && !originalRequest._retry) {
            originalRequest._retry = true;
            const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');

            if (tokens?.refresh) {
                try {
                    const response = await axios.post(`${baseURL}/auth/jwt/refresh/`, {
                        refresh: tokens.refresh,
                    }, { withCredentials: true });

                    const newTokens = response.data as { access: string; refresh: string };
                    localStorage.setItem('authTokens', JSON.stringify(newTokens));
                    
                    // Update user data in localStorage with new token information
                    try {
                        const decodedToken: any = JSON.parse(atob(newTokens.access.split('.')[1]));
                        const userData = {
                            id: decodedToken.user_id,
                            email: decodedToken.email,
                            username: decodedToken.username,
                            first_name: decodedToken.first_name,
                            last_name: decodedToken.last_name,
                            is_staff: decodedToken.is_staff,
                            is_superuser: decodedToken.is_superuser,
                            groups: decodedToken.groups,
                        };
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } catch (error) {
                        console.error('Failed to update user data from token', error);
                    }

                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;

                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed', refreshError);
                    localStorage.removeItem('authTokens');
                    localStorage.removeItem('userData');
                    delete axiosInstance.defaults.headers.common['Authorization'];
                    
                    // Check if the user was trying to access an admin route
                    const isAdminRoute = window.location.pathname.startsWith('/admin');
                    window.location.href = isAdminRoute ? '/admin/login' : '/login';
                    
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, logout
                localStorage.removeItem('authTokens');
                localStorage.removeItem('userData');
                delete axiosInstance.defaults.headers.common['Authorization'];
                
                // Check if the user was trying to access an admin route
                const isAdminRoute = window.location.pathname.startsWith('/admin');
                window.location.href = isAdminRoute ? '/admin/login' : '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

