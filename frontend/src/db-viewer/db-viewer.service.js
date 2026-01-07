import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const dbViewerService = {
  // 获取所有数据库
  async getAllDatabases() {
    const response = await api.get('/databases');
    return response.data;
  },

  // 创建新数据库
  async createDatabase(dbName) {
    const response = await api.post('/databases', { dbName });
    return response.data;
  },

  // 获取所有表名
  async getTables(dbName = 'taxfree') {
    const response = await api.get('/db/tables', {
      params: { db: dbName }
    });
    return response.data;
  },

  // 获取表结构
  async getTableStructure(tableName, dbName = 'taxfree') {
    const response = await api.get(`/db/tables/${tableName}/structure`, {
      params: { db: dbName }
    });
    return response.data;
  },

  // 获取表数据
  async getTableData(tableName, dbName = 'taxfree') {
    const response = await api.get(`/db/tables/${tableName}/data`, {
      params: { db: dbName }
    });
    return response.data;
  }
};

