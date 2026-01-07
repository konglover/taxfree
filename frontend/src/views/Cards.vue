<template>
  <div class="cards-page">
    <div class="cards-header">
      <h1>我的卡包</h1>
      <div class="header-actions">
        <button @click="addCard" class="btn-add">➕ 添加</button>
        <button @click="showScanDialog = true" class="btn-scan">📷 扫描</button>
        <button @click="handleLogout" class="btn-logout" title="退出登录">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索一维码、名称或商家..."
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <button
        v-for="owner in owners"
        :key="owner"
        @click="toggleOwnerFilter(owner)"
        :class="['filter-btn', { active: selectedOwner === (owner === '全部' ? '' : owner) }]"
      >
        {{ owner || '全部' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 卡包列表 -->
    <div v-else class="cards-list">
      <div v-if="cards.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>还没有卡包记录</p>
        <button @click="showScanDialog = true" class="btn-primary">开始扫描</button>
      </div>

      <div v-else class="card-item" v-for="card in cards" :key="card.id">
        <div class="card-content">
          <div class="card-main">
            <h3>{{ card.name || '未命名' }}</h3>
            <p class="card-barcode">{{ card.barcode }}</p>
            <div class="card-info">
              <span v-if="card.owner" class="info-tag">👤 {{ card.owner }}</span>
              <span v-if="card.merchant" class="info-tag">🏪 {{ card.merchant }}</span>
              <span v-if="card.amount" class="info-tag">💰 ¥{{ card.amount }}</span>
              <span v-if="card.date" class="info-tag">📅 {{ card.date }}</span>
            </div>
            <p v-if="card.note" class="card-note">{{ card.note }}</p>
          </div>
          <div class="card-actions">
            <button @click="previewBarcode(card)" class="btn-icon" title="预览一维码">👁️</button>
            <button @click="editCard(card)" class="btn-icon" title="编辑">✏️</button>
            <button @click="deleteCard(card.id)" class="btn-icon" title="删除">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑/添加模态框 -->
    <el-dialog
      v-model="showEditModal"
      :title="editingCard ? '编辑卡包' : '添加卡包'"
      width="90%"
      :close-on-click-modal="false"
      @close="closeEditModal"
      class="card-edit-dialog"
    >
      <el-form :model="cardForm" label-width="80px" @submit.prevent="saveCard">
        <el-form-item label="一维码" required>
          <el-input v-model="cardForm.barcode" placeholder="请输入一维码" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="cardForm.name" placeholder="例如：购物小票" />
        </el-form-item>
        <el-form-item label="绑定人" required>
          <el-select
            v-model="cardForm.owner"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入绑定人"
            style="width: 100%"
          >
            <el-option
              v-for="owner in owners.filter(o => o !== '全部')"
              :key="owner"
              :label="owner"
              :value="owner"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商家">
          <el-input v-model="cardForm.merchant" placeholder="例如：超市名称" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="cardForm.amount"
            :precision="2"
            :step="0.01"
            :min="0"
            placeholder="0.00"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="cardForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="cardForm.note"
            type="textarea"
            :rows="3"
            placeholder="添加备注信息"
          />
        </el-form-item>
        <el-alert
          v-if="saveError"
          :title="saveError"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeEditModal">取消</el-button>
          <el-button type="primary" @click="saveCard" :loading="saving">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 扫码Dialog -->
    <ScanDialog v-model="showScanDialog" @saved="handleScanSaved" @scanned="handleScanned" />

    <!-- 一维码预览模态框 -->
    <el-dialog
      v-model="showBarcodePreview"
      title="一维码预览"
      width="90%"
      :close-on-click-modal="true"
      class="barcode-preview-dialog"
    >
      <div class="barcode-preview-content">
        <div class="barcode-info">
          <p><strong>名称：</strong>{{ previewCard?.name || '未命名' }}</p>
          <p><strong>一维码：</strong>{{ previewCard?.barcode }}</p>
        </div>
        <div class="barcode-image-wrapper">
          <svg ref="barcodeSvg" class="barcode-svg"></svg>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBarcodePreview = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { cardsService } from '../services/cards.service.js';
import ScanDialog from '../components/ScanDialog.vue';
import JsBarcode from 'jsbarcode';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const cards = ref([]);
const loading = ref(false);
const error = ref('');
const showScanDialog = ref(false);
const searchQuery = ref('');
const selectedOwner = ref('');
const showEditModal = ref(false);
const editingCard = ref(null);
const saving = ref(false);
const saveError = ref('');
const showBarcodePreview = ref(false);
const previewCard = ref(null);
const barcodeSvg = ref(null);

// 防止并发请求
let isFetching = false;

const cardForm = ref({
  barcode: '',
  name: '',
  merchant: '',
  amount: null,
  date: new Date().toISOString().split('T')[0],
  note: '',
  owner: ''
});

// 绑定人列表
const owners = ref(['全部']);

// 获取绑定人列表（从服务端获取）
const fetchOwners = async () => {
  try {
    const response = await cardsService.getOwners();
    if (response && response.success && response.data) {
      owners.value = ['全部', ...response.data];
    } else {
      owners.value = ['全部'];
    }
  } catch (err) {
    console.error('获取绑定人列表失败:', err);
    owners.value = ['全部'];
  }
};

const fetchCards = async () => {
  // 如果正在请求中，直接返回
  if (isFetching) {
    console.log('已有请求在进行中，跳过本次调用');
    return;
  }
  
  isFetching = true;
  loading.value = true;
  error.value = '';
  
  try {
    const params = {};
    if (selectedOwner.value && selectedOwner.value !== '全部') {
      params.owner = selectedOwner.value;
    }
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    
    const response = await cardsService.getCards(params);
    
    // 后端返回格式: { success: true, data: [...] }
    // cardsService.getCards 返回 response.data，即 { success: true, data: [...] }
    if (response && response.data) {
      cards.value = Array.isArray(response.data) ? response.data : [];
    } else {
      cards.value = [];
      error.value = response?.error || '返回数据格式错误';
    }
    
    // 同时更新所有卡片列表（用于提取绑定人）
    // 同时更新绑定人列表
    await fetchOwners();
  } catch (err) {
    console.error('获取卡包列表失败:', err);
    error.value = err.response?.data?.error || err.message || '获取卡包列表失败';
    cards.value = [];
  } finally {
    // 确保 loading 状态一定会被重置
    loading.value = false;
    isFetching = false;
  }
};

// 防抖函数
const debounce = (func, delay) => {
  let timeoutId = null;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// 防抖后的搜索函数（3秒延迟）
const handleSearch = debounce(() => {
  fetchCards();
}, 3000);

const toggleOwnerFilter = (owner) => {
  const ownerValue = owner === '全部' ? '' : owner;
  
  // 如果点击的是当前已选中的，则取消选择（显示全部）
  if (selectedOwner.value === ownerValue) {
    selectedOwner.value = '';
  } else {
    // 否则选中该绑定人
    selectedOwner.value = ownerValue;
  }
  
  // 筛选列表
  fetchCards();
};

const handleScanSaved = () => {
  fetchCards();
  fetchOwners();
};

const handleScanned = (barcode) => {
  // 扫描成功后，关闭扫描对话框，打开添加卡包模态框并填充一维码
  showScanDialog.value = false;
  editingCard.value = null;
  cardForm.value = {
    barcode: barcode || '',
    name: '',
    merchant: '',
    amount: null,
    date: new Date().toISOString().split('T')[0],
    note: '',
    owner: ''
  };
  saveError.value = '';
  showEditModal.value = true;
};

const addCard = () => {
  editingCard.value = null;
  cardForm.value = {
    barcode: '',
    name: '',
    merchant: '',
    amount: null,
    date: new Date().toISOString().split('T')[0],
    note: '',
    owner: ''
  };
  saveError.value = '';
  showEditModal.value = true;
};

const editCard = (card) => {
  editingCard.value = card;
  cardForm.value = {
    barcode: card.barcode || '',
    name: card.name || '',
    merchant: card.merchant || '',
    amount: card.amount || null,
    date: card.date || new Date().toISOString().split('T')[0],
    note: card.note || '',
    owner: card.owner || ''
  };
  showEditModal.value = true;
};

const saveCard = async () => {
  // 验证必填字段
  if (!cardForm.value.barcode || !cardForm.value.barcode.trim()) {
    saveError.value = '一维码不能为空';
    return;
  }
  if (!cardForm.value.name || !cardForm.value.name.trim()) {
    saveError.value = '名称不能为空';
    return;
  }
  if (!cardForm.value.owner || !cardForm.value.owner.trim()) {
    saveError.value = '绑定人不能为空';
    return;
  }

  saving.value = true;
  saveError.value = '';

  try {
    const cardData = {
      barcode: cardForm.value.barcode.trim(),
      name: cardForm.value.name?.trim() || null,
      merchant: cardForm.value.merchant?.trim() || null,
      amount: cardForm.value.amount || null,
      date: cardForm.value.date || null,
      note: cardForm.value.note?.trim() || null,
      owner: cardForm.value.owner?.trim() || null
    };

    if (editingCard.value) {
      await cardsService.updateCard(editingCard.value.id, cardData);
    } else {
      await cardsService.createCard(cardData);
    }
    
    closeEditModal();
    fetchCards();
    fetchOwners();
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const deleteCard = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return;
  
  try {
    await cardsService.deleteCard(id);
    fetchCards();
    fetchOwners();
  } catch (err) {
    error.value = err.message || '删除失败';
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingCard.value = null;
  cardForm.value = {
    barcode: '',
    name: '',
    merchant: '',
    amount: null,
    date: new Date().toISOString().split('T')[0],
    note: '',
    owner: ''
  };
  saveError.value = '';
};

const previewBarcode = (card) => {
  previewCard.value = card;
  showBarcodePreview.value = true;
};

const generateBarcode = () => {
  if (!barcodeSvg.value || !previewCard.value?.barcode) return;
  
  try {
    // 清空 SVG
    barcodeSvg.value.innerHTML = '';
    
    // 生成一维码
    JsBarcode(barcodeSvg.value, previewCard.value.barcode, {
      format: 'CODE128', // 使用 CODE128 格式，支持字母和数字
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 16,
      margin: 10
    });
  } catch (err) {
    console.error('生成一维码失败:', err);
  }
};

// 监听预览模态框打开，生成一维码
watch(showBarcodePreview, (newVal) => {
  if (newVal) {
    nextTick(() => {
      generateBarcode();
    });
  }
});

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 退出登录
    authStore.logout();
    
    // 跳转到登录页
    router.push('/login');
  } catch {
    // 用户取消，不做任何操作
  }
};

onMounted(() => {
  fetchCards();
  fetchOwners();
});
</script>

<style scoped>
.cards-page {
  background: #f5f5f5;
  padding-bottom: 2rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cards-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.cards-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add,
.btn-scan,
.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-add:hover,
.btn-scan:hover,
.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-logout {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-logout svg {
  width: 18px;
  height: 18px;
}

.search-bar {
  padding: 1rem;
  background: white;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 99;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.filter-bar {
  padding: 2px 1rem 1rem 1rem;
  background: white;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  overflow-y: visible;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: fixed;
  top: calc(60px + 76px);
  left: 0;
  right: 0;
  z-index: 98;
}

.filter-bar::-webkit-scrollbar {
  height: 4px;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-sizing: border-box;
  flex-shrink: 0;
}

.filter-btn:hover {
  background: #f5f5f5;
  border-color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #666;
  margin-top: calc(60px + 76px + 60px);
  height: calc(100vh - 60px - 76px - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error {
  color: #f56565;
}

.cards-list {
  padding: 1rem;
  margin-top: calc(60px + 76px + 60px);
  overflow-y: auto;
  height: calc(100vh - 60px - 76px - 60px);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.card-item {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.card-main {
  flex: 1;
}

.card-main h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.card-barcode {
  font-family: monospace;
  color: #667eea;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  word-break: break-all;
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.info-tag {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #666;
}

.card-note {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-icon {
  background: #f0f0f0;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

/* Element Plus Dialog 样式调整 */
.card-edit-dialog :deep(.el-dialog) {
  border-radius: 12px;
  max-width: 500px;
  margin: 5vh auto;
}

.card-edit-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.card-edit-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 一维码预览模态框样式 */
.barcode-preview-dialog :deep(.el-dialog) {
  border-radius: 12px;
  max-width: 500px;
  margin: 5vh auto;
}

.barcode-preview-content {
  text-align: center;
  padding: 20px 0;
}

.barcode-info {
  margin-bottom: 2rem;
  text-align: left;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.barcode-info p {
  margin: 0.5rem 0;
  color: #333;
  font-size: 0.95rem;
}

.barcode-info strong {
  color: #667eea;
  margin-right: 0.5rem;
}

.barcode-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  min-height: 150px;
}

.barcode-svg {
  max-width: 100%;
  height: auto;
}
</style>














