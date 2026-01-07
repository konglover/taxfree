<template>
  <div class="db-viewer">
    <div class="viewer-header">
      <h1>数据库查看器</h1>
      <div class="db-info">
        <div class="db-selector">
          <label>选择数据库：</label>
          <select v-model="selectedDatabase" @change="onDatabaseChange" class="db-select">
            <option v-for="db in databases" :key="db" :value="db">
              {{ db }}.db
            </option>
          </select>
        </div>
        <div class="header-actions">
          <!-- <button @click="showCreateModal = true" class="btn-create">
            ➕ 新建数据库
          </button> -->
          <button @click="refreshDatabase" class="btn-refresh" :disabled="loading">
            {{ loading ? '刷新中...' : '🔄 刷新' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-else class="viewer-content">
      <!-- 侧边栏：表列表 -->
      <div class="sidebar">
        <h3>数据表 ({{ selectedDatabase }}.db)</h3>
        <div v-if="loading" class="loading">加载中...</div>
        <ul v-else class="table-list">
          <li
            v-for="table in tables"
            :key="table"
            :class="{ active: selectedTable === table }"
            @click="selectTable(table)"
          >
            📊 {{ table }}
            <span class="row-count">({{ getTableRowCount(table) }} 行)</span>
          </li>
        </ul>
      </div>

      <!-- 主内容区 -->
      <div class="main-panel">
        <div v-if="!selectedTable" class="empty-state">
          <p>👈 请从左侧选择一个数据表</p>
        </div>

        <div v-else>
          <!-- 表信息 -->
          <div class="table-info">
            <h2>📊 {{ selectedTable }}</h2>
            <div class="info-badge">
              <span>总行数: {{ currentTableData.length }}</span>
              <span>列数: {{ tableColumns.length }}</span>
            </div>
          </div>

          <!-- 表结构 -->
          <div class="table-structure">
            <h3>表结构</h3>
            <div class="structure-table">
              <table>
                <thead>
                  <tr>
                    <th>列名</th>
                    <th>类型</th>
                    <th>非空</th>
                    <th>默认值</th>
                    <th>主键</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="col in tableColumns" :key="col.name">
                    <td><strong>{{ col.name }}</strong></td>
                    <td>{{ col.type }}</td>
                    <td>{{ col.notnull ? '是' : '否' }}</td>
                    <td>{{ col.dflt_value || '-' }}</td>
                    <td>{{ col.pk ? '✓' : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 表数据 -->
          <div class="table-data">
            <h3>数据内容</h3>
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th v-for="col in tableColumns" :key="col.name">
                      {{ col.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentTableData.length === 0">
                    <td :colspan="tableColumns.length" class="empty-data">
                      暂无数据
                    </td>
                  </tr>
                  <tr v-else v-for="(row, index) in currentTableData" :key="index">
                    <td v-for="col in tableColumns" :key="col.name" :class="{ 'null-value': row[col.name] === null || row[col.name] === undefined }">
                      {{ formatValue(row[col.name]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建数据库模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <h2>创建新数据库</h2>
        <form @submit.prevent="createDatabase">
          <div class="form-group">
            <label>数据库名称</label>
            <input
              v-model="newDbName"
              type="text"
              required
              placeholder="请输入数据库名称（仅支持字母、数字、下划线、连字符）"
              pattern="[a-zA-Z0-9_-]+"
              class="form-input"
            />
            <small class="form-hint">只能包含字母、数字、下划线和连字符</small>
          </div>
          <div v-if="createError" class="error-text">
            {{ createError }}
          </div>
          <div class="form-actions">
            <button type="button" @click="closeCreateModal" class="btn btn-cancel">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { dbViewerService } from './db-viewer.service.js';

const databases = ref([]);
const selectedDatabase = ref('taxfree');
const tables = ref([]);
const selectedTable = ref('');
const tableColumns = ref([]);
const tableData = ref({});
const loading = ref(false);
const error = ref('');

// 创建数据库相关
const showCreateModal = ref(false);
const newDbName = ref('');
const creating = ref(false);
const createError = ref('');

const currentTableData = computed(() => {
  return selectedTable.value ? (tableData.value[selectedTable.value] || []) : [];
});

const getTableRowCount = (tableName) => {
  return tableData.value[tableName]?.length || 0;
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  return value;
};

const fetchDatabases = async () => {
  try {
    const response = await dbViewerService.getAllDatabases();
    databases.value = response.data;
    
    // 如果当前选择的数据库不在列表中，选择第一个
    if (databases.value.length > 0 && !databases.value.includes(selectedDatabase.value)) {
      selectedDatabase.value = databases.value[0];
    }
    
    // 加载表
    await fetchTables();
  } catch (err) {
    error.value = err.message || '获取数据库列表失败';
  }
};

const fetchTables = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await dbViewerService.getTables(selectedDatabase.value);
    tables.value = response.data;
    
    // 如果有表，默认选择第一个
    if (tables.value.length > 0 && !selectedTable.value) {
      selectTable(tables.value[0]);
    } else {
      selectedTable.value = '';
      tableColumns.value = [];
      tableData.value = {};
    }
  } catch (err) {
    error.value = err.message || '获取表列表失败';
  } finally {
    loading.value = false;
  }
};

const selectTable = async (tableName) => {
  selectedTable.value = tableName;
  loading.value = true;
  error.value = '';
  
  try {
    // 获取表结构和数据
    const [structureRes, dataRes] = await Promise.all([
      dbViewerService.getTableStructure(tableName, selectedDatabase.value),
      dbViewerService.getTableData(tableName, selectedDatabase.value)
    ]);
    
    tableColumns.value = structureRes.data;
    tableData.value[tableName] = dataRes.data;
  } catch (err) {
    error.value = err.message || `获取表 ${tableName} 数据失败`;
  } finally {
    loading.value = false;
  }
};

const onDatabaseChange = async () => {
  selectedTable.value = '';
  tableColumns.value = [];
  tableData.value = {};
  await fetchTables();
};

const refreshDatabase = async () => {
  selectedTable.value = '';
  tableColumns.value = [];
  tableData.value = {};
  await fetchDatabases();
};

const createDatabase = async () => {
  if (!newDbName.value.trim()) {
    createError.value = '请输入数据库名称';
    return;
  }

  // 验证数据库名称格式
  if (!/^[a-zA-Z0-9_-]+$/.test(newDbName.value)) {
    createError.value = '数据库名称只能包含字母、数字、下划线和连字符';
    return;
  }

  // 检查是否已存在
  if (databases.value.includes(newDbName.value)) {
    createError.value = '数据库已存在';
    return;
  }

  creating.value = true;
  createError.value = '';

  try {
    await dbViewerService.createDatabase(newDbName.value);
    
    // 创建成功，刷新数据库列表
    await fetchDatabases();
    
    // 切换到新创建的数据库
    selectedDatabase.value = newDbName.value;
    await fetchTables();
    
    // 关闭模态框
    closeCreateModal();
  } catch (err) {
    createError.value = err.response?.data?.error || err.message || '创建数据库失败';
  } finally {
    creating.value = false;
  }
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  newDbName.value = '';
  createError.value = '';
};

onMounted(() => {
  fetchDatabases();
});
</script>

<style scoped>
.db-viewer {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.viewer-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.db-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.db-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.db-selector label {
  font-size: 0.9rem;
  color: #666;
}

.db-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  min-width: 150px;
}

.db-select:focus {
  outline: none;
  border-color: #667eea;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-create {
  padding: 0.5rem 1rem;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-create:hover {
  background: #38a169;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-refresh:hover:not(:disabled) {
  background: #5568d3;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem 2rem;
  margin: 1rem 2rem;
  border-radius: 6px;
  border-left: 4px solid #c33;
}

.viewer-content {
  display: flex;
  height: calc(100vh - 120px);
  gap: 1rem;
  padding: 1rem;
}

.sidebar {
  width: 250px;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.table-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.table-list li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.table-list li:hover {
  background: #f0f0f0;
}

.table-list li.active {
  background: #667eea;
  color: white;
  border-color: #5568d3;
}

.row-count {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-left: 0.5rem;
}

.main-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
  font-size: 1.2rem;
}

.table-info {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.table-info h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.info-badge {
  display: flex;
  gap: 1rem;
}

.info-badge span {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #666;
}

.table-structure {
  margin-bottom: 2rem;
}

.table-structure h3,
.table-data h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.structure-table {
  overflow-x: auto;
}

.structure-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.structure-table th,
.structure-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.structure-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.data-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 600px;
}

.data-table th {
  background: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.empty-data {
  text-align: center;
  color: #999;
  padding: 2rem !important;
}

.null-value {
  color: #999;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #999;
}

/* 创建数据库模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #999;
}

.error-text {
  color: #f56565;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #fee;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e2e8f0;
  color: #333;
}

.btn-cancel:hover {
  background: #cbd5e0;
}
</style>

