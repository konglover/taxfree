import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 token 过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // token 无效或过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const cardsService = {
  async getCards(params = {}) {
    const response = await api.get('/cards', { params });
    return response.data;
  },

  async getCardById(id) {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  async createCard(card) {
    try {
      console.log('cardsService.createCard - 发送请求:', card);
      const response = await api.post('/cards', card);
      console.log('cardsService.createCard - 响应成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('cardsService.createCard - 请求失败:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      throw error; // 重新抛出错误，让调用者处理
    }
  },

  async updateCard(id, card) {
    const response = await api.put(`/cards/${id}`, card);
    return response.data;
  },

  async deleteCard(id) {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },

  async getOwners() {
    const response = await api.get('/cards/owners');
    return response.data;
  }
};














