<template>
  <div class="receipt-input-page">
    <!-- Header -->
    <div class="page-header">
      <button class="btn-back" @click="$router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <div class="header-title">
        <h1 class="title-text">采集录入</h1>
        <p class="title-sub">{{ selectedOwnerName }}</p>
      </div>
    </div>

    <!-- 扫码模式 -->
    <template v-if="!showManualInput">
      <div class="scan-area">
        <div v-if="scanningError" class="scan-error">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h3>无法启动相机</h3>
          <p>请检查相机权限或使用手动输入</p>
          <button class="btn-manual" @click="switchToManual">
            手动输入票号
          </button>
        </div>
        <div v-else class="scan-ui-container">
          <div class="scan-card">
            <div class="scan-header">
              <div class="scan-status-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                </svg>
              </div>
              <p class="scan-hint-text">将小票条码对准扫描框</p>
            </div>
            
            <div id="qr-reader" class="qr-reader"></div>

            <div v-if="ticketNumber" :class="['scanned-result-overlay', { 'is-processing': isPaused }]">
              <div v-if="isPaused" class="success-check-mark">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="4">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p class="scanned-label">已识别票号</p>
                <p class="scanned-value">{{ ticketNumber }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 手动输入/确认模式 -->
    <template v-else>
      <div class="manual-area">
        <div class="manual-box">
          <div class="manual-icon">
            <svg v-if="ticketNumber" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
              <line x1="6" y1="8" x2="18" y2="8"/>
              <line x1="6" y1="12" x2="18" y2="12"/>
            </svg>
          </div>
          <h3>{{ ticketNumber ? '确认票号' : '手动录入' }}</h3>
          <p class="manual-hint">{{ ticketNumber ? '请检查识别结果是否准确，如有误请手动修改' : '请输入小票上的条码或二维码数字' }}</p>
          <el-input
            ref="ticketInputRef"
            v-model="ticketNumber"
            placeholder="请输入票号"
            class="ticket-input"
            @keydown.enter="saveReceipt"
          />
          <div class="manual-btns">
            <button class="btn-outline" @click="switchToScan">重新扫码</button>
            <button class="btn-primary" :disabled="!ticketNumber?.trim()" @click="saveReceipt">
              {{ ticketNumber ? '确认并保存' : '立即保存' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 底部操作区 -->
    <div class="bottom-bar">
      <div class="owner-section">
        <p class="section-label">归属分堆</p>
        <div class="owner-chips scroll-hide">
          <button
            :class="['chip', { active: selectedOwner === '' }]"
            @click="selectedOwner = ''"
          >
            ⚪ 未指定
          </button>
          <button
            v-for="o in owners"
            :key="o.id"
            :class="['chip', { active: selectedOwner === o.id }]"
            @click="selectedOwner = o.id"
          >
            👤 {{ o.name }}
          </button>
          <button class="chip-add" @click="showAddOwner = true">
            + 新增
          </button>
        </div>
      </div>
      <div class="action-btns">
        <button v-if="!showManualInput" class="btn-outline" @click="switchToManual">
          无法识别？手动输入
        </button>
        <button v-if="ticketNumber && !showManualInput" class="btn-gradient" @click="saveReceipt">
          保存
        </button>
      </div>
    </div>

    <!-- 新增持有人 -->
    <div v-if="showAddOwner" class="figma-dialog-overlay" @click.self="showAddOwner = false">
      <div class="figma-dialog">
        <div class="figma-dialog-header">
          <h3 class="figma-dialog-title">新增持有人</h3>
        </div>
        <div class="figma-dialog-body">
          <div class="form-group">
            <label class="figma-label">持有人姓名</label>
            <input
              v-model="newOwnerName"
              placeholder="请输入持有人姓名（如：张三）"
              class="figma-input"
              @keydown.enter="handleAddOwner"
              autofocus
            />
          </div>
        </div>
        <div class="figma-dialog-footer">
          <button class="btn-outline" @click="showAddOwner = false">取消</button>
          <button class="btn-primary" :disabled="!newOwnerName.trim()" @click="handleAddOwner">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Html5Qrcode } from 'html5-qrcode';
import { loadData, addReceipt, addOwner } from '../utils/receiptStorage.js';

const ticketNumber = ref('');
const selectedOwner = ref('');
const owners = ref([]);
const showManualInput = ref(false);
const showAddOwner = ref(false);
const newOwnerName = ref('');
const isScanning = ref(true);
const scanningError = ref(false);
const isPaused = ref(false); // 新增：正在暂停处理，防止重复扫码
const ticketInputRef = ref(null);
let scannerInstance = null;

const selectedOwnerName = computed(() => {
  if (!selectedOwner.value) return '未指定持有人';
  const o = owners.value.find((x) => x.id === selectedOwner.value);
  return o?.name || '未指定持有人';
});

const startScanner = async () => {
  try {
    scannerInstance = new Html5Qrcode('qr-reader');
    await scannerInstance.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 280 } },
      (decodedText) => {
        // 如果在暂停中，忽略当前扫码结果
        if (isPaused.value) return;

        handleScannedResult(decodedText);
      },
      () => {}
    );
  } catch (err) {
    console.error('Scanner error:', err);
    scanningError.value = true;
  }
};

const handleScannedResult = (text) => {
  isPaused.value = true;
  ticketNumber.value = text;
  
  // 识别成功后，延迟一小会儿自动进入“确认/手动修正”模式
  setTimeout(() => {
    isPaused.value = false;
    showManualInput.value = true; // 切换到手动确认页面
    isScanning.value = false;
    nextTick(() => ticketInputRef.value?.focus());
    
    ElMessage({
      message: '请确认或修正票号',
      type: 'info',
      duration: 2000
    });
  }, 800);
};

const stopScanner = () => {
  if (scannerInstance) {
    scannerInstance.stop().catch(console.error);
    scannerInstance = null;
  }
};

const switchToManual = () => {
  stopScanner();
  showManualInput.value = true;
  isScanning.value = false;
  nextTick(() => ticketInputRef.value?.focus());
};

const switchToScan = () => {
  showManualInput.value = false;
  ticketNumber.value = '';
  isScanning.value = true;
};

const saveReceipt = () => {
  if (!ticketNumber.value?.trim()) {
    ElMessage.error('请输入或扫描票号');
    return;
  }
  addReceipt(ticketNumber.value.trim(), selectedOwner.value);
  ElMessage.success('小票已保存');
  ticketNumber.value = '';
  if (showManualInput.value) {
    switchToScan();
  }
};

const handleAddOwner = () => {
  if (!newOwnerName.value?.trim()) {
    ElMessage.error('请输入持有人姓名');
    return;
  }
  const owner = addOwner(newOwnerName.value.trim());
  const data = loadData();
  owners.value = data.owners;
  selectedOwner.value = owner.id;
  newOwnerName.value = '';
  showAddOwner.value = false;
  ElMessage.success(`已添加持有人：${owner.name}`);
};

watch([isScanning, showManualInput], ([scan, manual]) => {
  if (scan && !manual) {
    nextTick(() => startScanner());
  } else {
    stopScanner();
  }
});

onMounted(() => {
  const data = loadData();
  owners.value = data.owners;
  selectedOwner.value = data.lastSelectedOwner || '';
  if (isScanning.value && !showManualInput.value) startScanner();
});

onUnmounted(stopScanner);
</script>

<style scoped>
.receipt-input-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #eff6ff, #f5f3ff, #fdf2f8);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-back {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #374151;
}

.btn-back:hover {
  background: #ede9fe;
}

.header-title {
  flex: 1;
}

.title-text {
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(to right, #2563eb, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.title-sub {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.scan-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  justify-content: center;
  align-items: center;
}

.scan-ui-container {
  width: 100%;
  max-width: 28rem;
}

.scan-card {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.scan-status-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(to bottom right, #3b82f6, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

.scan-hint-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
  margin: 0;
}

.qr-reader {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  position: relative;
  border: 1px solid #e5e7eb;
}

/* 让 html5-qrcode 生成的摄像头区域填满容器 */
.qr-reader :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.qr-reader :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.scanned-result-overlay {
  padding: 1rem;
  background: linear-gradient(to right, #eff6ff, #f5f3ff);
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.scanned-result-overlay.is-processing {
  border-color: #10b981;
  background: #f0fdf4;
}

.success-check-mark {
  width: 40px;
  height: 40px;
  background: #d1fae5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.scanned-result-overlay {
  padding: 1rem;
  background: linear-gradient(to right, #eff6ff, #f5f3ff);
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.scanned-result-overlay.is-processing {
  border-color: #10b981;
  background: #f0fdf4;
}

.success-check-mark {
  width: 40px;
  height: 40px;
  background: #d1fae5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.scanned-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
}

.scanned-value {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #2563eb;
  font-size: 1.125rem;
  margin: 0;
}

.manual-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.scan-error, .manual-box {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 28rem;
  text-align: center;
}

.manual-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #d1fae5, #eff6ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #10b981;
}

.manual-box h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.manual-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
}

.ticket-input {
  margin-bottom: 1.5rem;
}

.ticket-input :deep(.el-input__wrapper) {
  font-size: 1.125rem;
  text-align: center;
  font-family: ui-monospace, monospace;
}

.manual-btns {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.bottom-bar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 0.5rem;
}

.owner-chips {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0.25rem 0.75rem;
  scroll-behavior: smooth;
}

.scroll-hide::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid #e5e7eb;
  background: white;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chip:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.chip.active {
  background: linear-gradient(to right, #3b82f6, #a855f7);
  color: white;
  border-color: transparent;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.chip.active:active {
  transform: scale(0.96) translateY(0);
}

.chip-add {
  flex-shrink: 0;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px dashed #2563eb;
  background: rgba(37, 99, 235, 0.04);
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-add:hover {
  background: #eff6ff;
  border-color: #9333ea;
  color: #9333ea;
  border-style: solid;
}

.action-btns {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btns button {
  flex: 1;
}
</style>
