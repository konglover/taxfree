<template>
  <div class="users-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        添加用户
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="users-list">
      <div v-if="users.length === 0" class="empty-state">
        暂无用户数据
      </div>
      <div v-else class="users-grid">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
          </div>
          <div class="user-actions">
            <button @click="editUser(user)" class="btn btn-edit">编辑</button>
            <button @click="deleteUser(user.id)" class="btn btn-delete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑用户模态框 -->
    <div v-if="showAddModal || editingUser" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingUser ? '编辑用户' : '添加用户' }}</h2>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>姓名</label>
            <input
              v-model="userForm.name"
              type="text"
              required
              placeholder="请输入姓名"
            />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input
              v-model="userForm.email"
              type="email"
              required
              placeholder="请输入邮箱"
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-cancel">
              取消
            </button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userService } from '../services/user.service.js';

const users = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);
const editingUser = ref(null);
const userForm = ref({
  name: '',
  email: ''
});

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await userService.getUsers();
    users.value = response.data;
  } catch (err) {
    error.value = err.message || '获取用户列表失败';
  } finally {
    loading.value = false;
  }
};

const saveUser = async () => {
  try {
    if (editingUser.value) {
      await userService.updateUser(editingUser.value.id, userForm.value);
    } else {
      await userService.createUser(userForm.value);
    }
    closeModal();
    fetchUsers();
  } catch (err) {
    error.value = err.message || '保存用户失败';
  }
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.value = { name: user.name, email: user.email };
};

const deleteUser = async (id) => {
  if (!confirm('确定要删除这个用户吗？')) return;
  
  try {
    await userService.deleteUser(id);
    fetchUsers();
  } catch (err) {
    error.value = err.message || '删除用户失败';
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingUser.value = null;
  userForm.value = { name: '', email: '' };
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.users-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #333;
  font-size: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-edit {
  background: #48bb78;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-edit:hover {
  background: #38a169;
}

.btn-delete {
  background: #f56565;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-delete:hover {
  background: #e53e3e;
}

.btn-cancel {
  background: #e2e8f0;
  color: #333;
}

.btn-cancel:hover {
  background: #cbd5e0;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #f56565;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.user-info p {
  color: #666;
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

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
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #333;
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  border-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
</style>

