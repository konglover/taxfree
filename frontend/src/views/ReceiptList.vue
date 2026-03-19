<template>
  <div class="receipt-list-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-inner">
        <div class="header-title">
          <div class="title-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h1 class="title-text">退税小票管理</h1>
            <p class="title-sub">共 {{ receipts.length }} 张小票</p>
          </div>
        </div>
        <div class="view-tabs">
          <button
            :class="['tab-btn', { active: viewMode === 'all' }]"
            @click="viewMode = 'all'"
          >
            全部 ({{ receipts.length }})
          </button>
          <button
            :class="['tab-btn abnormal', { active: viewMode === 'abnormal' }]"
            @click="viewMode = 'abnormal'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            异常 ({{ abnormalCount }})
          </button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <template v-if="groupedReceipts.length === 0">
        <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>{{ viewMode === 'abnormal' ? '暂无异常小票' : '还没有小票' }}</h3>
          <p>{{ viewMode === 'abnormal' ? '所有小票都正常' : '点击下方按钮开始录入小票' }}</p>
        </div>
      </template>
      <template v-else>
        <div v-for="(group, groupIndex) in groupedReceipts" :key="group.owner || 'unassigned'" class="group-card">
          <div class="group-header">
            <div class="group-info">
              <div class="group-icon">
                <svg v-if="group.owner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 class="group-name">{{ group.ownerName }}</h2>
                <p class="group-count">{{ group.receipts.length }} 张小票</p>
              </div>
            </div>
            <div class="group-actions">
              <button class="btn-scan" @click="goScanner(group.owner)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M7 15h0M2 9h20"/>
                  <rect x="15" y="12" width="4" height="4" rx="0.5"/>
                </svg>
                出示退税码
              </button>
              <button v-if="group.owner" class="btn-del" @click="confirmDeleteOwner(group.owner)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="receipt-items">
            <div
              v-for="(receipt, index) in group.receipts"
              :key="receipt.id"
              :class="['receipt-item', { abnormal: receipt.isAbnormal }]"
            >
              <div class="receipt-num">#{{ index + 1 }}</div>
              <div class="receipt-main">
                <p class="receipt-ticket">{{ receipt.ticketNumber }}</p>
                <p class="receipt-time">{{ formatTime(receipt.createdAt) }}</p>
              </div>
              <span v-if="receipt.isAbnormal" class="badge-abnormal">异常</span>
              <div class="receipt-actions">
                <button class="btn-edit" @click="editReceipt(receipt)" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-del-item" @click="confirmDeleteReceipt(receipt.id)" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <div class="bottom-bar-inner">
      <button class="btn-primary" @click="$router.push('/input')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        继续录入
      </button>
      <button v-if="receipts.length === 0" class="btn-demo" @click="loadDemo">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        加载演示数据
      </button>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editDialogVisible" class="figma-dialog-overlay" @click.self="editDialogVisible = false">
      <div class="figma-dialog">
        <div class="figma-dialog-header">
          <h3 class="figma-dialog-title">编辑小票</h3>
        </div>
        <div class="figma-dialog-body">
          <div class="edit-form">
            <div class="form-group">
              <label class="figma-label">票号</label>
              <input
                v-model="editTicketNumber"
                placeholder="请输入票号"
                class="figma-input font-mono"
              />
            </div>
            <div class="form-group" style="margin-top: 1.25rem;">
              <label class="figma-label">持有人</label>
              <div class="owner-chips">
                <button
                  :class="['chip', { active: editOwner === '' }]"
                  @click="editOwner = ''"
                >
                  未指定
                </button>
                <button
                  v-for="o in owners"
                  :key="o.id"
                  :class="['chip', { active: editOwner === o.id }]"
                  @click="editOwner = o.id"
                >
                  {{ o.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="figma-dialog-footer">
          <button class="btn-outline" @click="editDialogVisible = false">取消</button>
          <button class="btn-primary" @click="saveEdit">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <div v-if="deleteDialogVisible" class="figma-dialog-overlay" @click.self="deleteDialogVisible = false">
      <div class="figma-dialog">
        <div class="figma-dialog-header">
          <h3 class="figma-dialog-title">确认删除</h3>
        </div>
        <div class="figma-dialog-body">
          <p style="color: #616161; font-size: 0.9375rem; line-height: 1.6; margin: 0;">
            {{ deleteTarget?.type === 'owner' ? '删除持有人后，其关联的小票将归到"未指定持有人"。' : '确定要删除这张小票吗？此操作无法撤销。' }}
          </p>
        </div>
        <div class="figma-dialog-footer">
          <button class="btn-outline" @click="deleteDialogVisible = false">取消</button>
          <button class="btn-primary" style="background: var(--destructive); box-shadow: 0 4px 14px rgba(212, 24, 61, 0.3);" @click="doDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { loadData, updateReceipt, deleteReceipt, deleteOwner, loadDemoData } from '../utils/receiptStorage.js';

const router = useRouter();
const receipts = ref([]);
const owners = ref([]);
const viewMode = ref('all');
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingReceipt = ref(null);
const editTicketNumber = ref('');
const editOwner = ref('');
const deleteTarget = ref(null);

const abnormalCount = computed(() => receipts.value.filter((r) => r.isAbnormal).length);

const filteredReceipts = computed(() =>
  viewMode.value === 'abnormal' ? receipts.value.filter((r) => r.isAbnormal) : receipts.value
);

const groupedReceipts = computed(() => {
  const groups = [];
  const unassigned = filteredReceipts.value.filter((r) => !r.owner);
  if (unassigned.length > 0) {
    groups.push({ owner: '', ownerName: '未指定持有人', receipts: unassigned });
  }
  owners.value.forEach((o) => {
    const list = filteredReceipts.value.filter((r) => r.owner === o.id);
    if (list.length > 0) {
      groups.push({ owner: o.id, ownerName: o.name, receipts: list });
    }
  });
  return groups;
});

const refresh = () => {
  const data = loadData();
  receipts.value = data.receipts;
  owners.value = data.owners;
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const editReceipt = (r) => {
  editingReceipt.value = r;
  editTicketNumber.value = r.ticketNumber;
  editOwner.value = r.owner || '';
  editDialogVisible.value = true;
};

const saveEdit = () => {
  if (!editTicketNumber.value?.trim()) {
    ElMessage.error('票号不能为空');
    return;
  }
  updateReceipt(editingReceipt.value.id, {
    ticketNumber: editTicketNumber.value.trim(),
    owner: editOwner.value
  });
  refresh();
  editDialogVisible.value = false;
  ElMessage.success('修改成功');
};

const confirmDeleteReceipt = (id) => {
  deleteTarget.value = { type: 'receipt', id };
  deleteDialogVisible.value = true;
};

const confirmDeleteOwner = (id) => {
  deleteTarget.value = { type: 'owner', id };
  deleteDialogVisible.value = true;
};

const doDelete = () => {
  if (deleteTarget.value?.type === 'receipt') {
    deleteReceipt(deleteTarget.value.id);
    ElMessage.success('已删除小票');
  } else if (deleteTarget.value?.type === 'owner') {
    deleteOwner(deleteTarget.value.id);
    ElMessage.success('已删除持有人');
  }
  refresh();
  deleteDialogVisible.value = false;
  deleteTarget.value = null;
};

const goScanner = (ownerId) => {
  router.push(`/scanner/${ownerId || ''}`);
};

const loadDemo = () => {
  loadDemoData();
  refresh();
  ElMessage.success('演示数据已加载');
};

onMounted(refresh);
</script>

<style scoped>
.receipt-list-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #eff6ff, #f5f3ff, #fdf2f8);
  padding-bottom: 120px;
}

.page-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: 672px;
  margin: 0 auto;
  padding: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.title-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #a855f7);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.title-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #2563eb, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.title-sub {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.view-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f9fafb;
}

.tab-btn.active {
  background: linear-gradient(to right, #3b82f6, #a855f7);
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.tab-btn.abnormal.active {
  background: linear-gradient(to right, #ef4444, #f97316);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

.tab-btn svg {
  vertical-align: middle;
  margin-right: 4px;
}

.content-inner {
  max-width: 672px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.empty-state {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #3b82f6;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #111;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.group-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 1rem;
}

.group-header {
  background: linear-gradient(to right, #3b82f6, #a855f7);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.group-name {
  font-weight: 600;
  color: white;
  margin: 0;
  font-size: 1rem;
}

.group-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0 0;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-scan {
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-scan:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-del {
  padding: 0.35rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 6px;
}

.btn-del:hover {
  background: rgba(255, 255, 255, 0.2);
}

.receipt-items {
  border-top: 1px solid #f3f4f6;
}

.receipt-item {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.4);
  border-bottom: 1px solid #f3f4f6;
}

.receipt-item:last-child {
  border-bottom: none;
}

.receipt-item.abnormal {
  background: rgba(254, 226, 226, 0.8);
}

.receipt-num {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  flex-shrink: 0;
}

.receipt-main {
  flex: 1;
  min-width: 0;
}

.receipt-ticket {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.receipt-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.badge-abnormal {
  background: linear-gradient(to right, #ef4444, #f97316);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
}

.receipt-actions {
  display: flex;
  gap: 4px;
}

.btn-edit, .btn-del-item {
  padding: 0.35rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-edit svg { color: #2563eb; }

.btn-del-item:hover {
  background: #fee2e2;
}

.btn-del-item svg { color: #ef4444; }

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

.bottom-bar-inner {
  max-width: 672px;
  margin: 0 auto;
}

.bottom-bar-inner .btn-demo {
  margin-top: 0.5rem;
}

.btn-primary {
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(to right, #3b82f6, #a855f7);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.btn-demo {
  width: 100%;
  padding: 0.875rem;
  background: white;
  border: 2px solid #bfdbfe;
  border-radius: 12px;
  color: #3b82f6;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-demo:hover {
  background: #eff6ff;
}

.edit-form .form-group {
  margin-bottom: 1.25rem;
}

.edit-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.owner-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
}

.chip:hover {
  background: #e5e7eb;
}

.chip.active {
  background: linear-gradient(to right, #3b82f6, #a855f7);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.font-mono {
  font-family: ui-monospace, monospace !important;
}
</style>
