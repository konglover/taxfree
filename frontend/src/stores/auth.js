import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth.service.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const loading = ref(false);
  const error = ref(null);

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // 初始化：从本地存储恢复用户信息
  const initAuth = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      token.value = storedToken;
    }
    
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        user.value = null;
      }
    }
  };

  // 注册
  const register = async (userData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        
        // 保存到本地存储
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return { success: true };
      } else {
        error.value = response.error || '注册失败';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.response?.data?.error || err.message || '注册失败';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // 登录
  const login = async (credentials) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        
        // 保存到本地存储
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return { success: true };
      } else {
        error.value = response.error || '登录失败';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.response?.data?.error || err.message || '登录失败';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // 登出
  const logout = () => {
    authService.logout();
    token.value = null;
    user.value = null;
    error.value = null;
  };

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (!token.value) {
      return;
    }
    
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        user.value = response.data;
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      // 如果获取失败，可能是 token 过期，清除状态
      logout();
    }
  };

  // 清除错误
  const clearError = () => {
    error.value = null;
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initAuth,
    register,
    login,
    logout,
    fetchCurrentUser,
    clearError
  };
});






