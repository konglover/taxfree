<template>
  <div class="receipt-scanner-page">
    <!-- 模式选择 -->
    <div v-if="includeUnassigned === null" class="mode-dialog">
      <div class="mode-card">
        <div class="mode-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <h2 class="mode-title">选择扫描模式</h2>
        <p class="mode-desc">
          <template v-if="ownerId">
            正在为 <span class="highlight">{{ ownerName }}</span> 准备扫描队列
          </template>
          <template v-else>
            正在为未指定持有人准备扫描队列
          </template>
        </p>
        <p v-if="ownerId" class="mode-hint">是否包含"未指定持有人"的小票？</p>
        <div class="mode-btns">
          <template v-if="ownerId">
            <button class="btn-mode primary" @click="handleConfirmMode(true)">
              包含未指定持有人的小票
            </button>
            <button class="btn-mode outline" @click="handleConfirmMode(false)">
              仅扫描 {{ ownerName }} 的小票
            </button>
          </template>
          <template v-else>
            <button class="btn-mode primary" @click="handleConfirmMode(false)">
              开始扫描
            </button>
          </template>
          <button class="btn-mode ghost" @click="$router.push('/')">取消</button>
        </div>
      </div>
    </div>

    <!-- 无小票 -->
    <div v-else-if="receipts.length === 0" class="mode-dialog">
      <div class="mode-card empty">
        <div class="empty-icon">!</div>
        <h3>没有可扫描的小票</h3>
        <p>请先添加小票后再进行扫描</p>
        <button class="btn-mode primary" @click="$router.push('/')">返回列表</button>
      </div>
    </div>

    <!-- 扫描展示 -->
    <template v-else>
      <div class="scanner-main">
        <div class="scanner-header">
          <button class="btn-back" @click="$router.push('/')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div class="header-center">
            <p class="owner-badge">
              <span class="dot"></span>
              {{ ownerName }}
            </p>
            <p class="count-badge">{{ currentIndex + 1 }} / {{ receipts.length }}</p>
          </div>
          <div class="header-spacer"></div>
        </div>

        <div v-if="currentReceipt && !currentReceipt.owner" class="owner-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          未指定持有人，随当前护照退税
        </div>

        <div class="code-area">
          <swiper
            v-if="receipts.length > 0"
            :slides-per-view="1"
            :space-between="50"
            :initial-slide="currentIndex"
            class="scanner-swiper"
            @slideChange="onSlideChange"
            @swiper="onSwiperInit"
          >
            <swiper-slide v-for="(receipt, index) in receipts" :key="receipt.id">
              <div class="slide-content-wrapper">
                <div class="code-card-container" @click="toggleCodeType">
                  <div :class="['code-card-inner', { flipped: codeType === 'qr' }]">
                    <!-- 条形码 -->
                    <div class="code-card-front">
                      <canvas :ref="el => setBarcodeRef(el, index)"></canvas>
                      <div v-if="codeType === 'barcode'" class="code-overlay"></div>
                    </div>
                    <!-- 二维码 -->
                    <div class="code-card-back">
                      <canvas :ref="el => setQrRef(el, index)"></canvas>
                      <div v-if="codeType === 'qr'" class="code-overlay"></div>
                    </div>
                  </div>
                </div>
                <p class="code-ticket">{{ receipt.ticketNumber }}</p>
              </div>
            </swiper-slide>
          </swiper>
          
          <!-- 切换器 -->
          <div class="code-switch-container">
            <button 
              :class="['switch-btn', { active: codeType === 'barcode' }]"
              @click="codeType = 'barcode'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 5v14M21 5v14M7 5v14M11 5v14M15 5v14M17 5v14"/>
              </svg>
              条形码
            </button>
            <button 
              :class="['switch-btn', { active: codeType === 'qr' }]"
              @click="codeType = 'qr'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="3"/>
                <rect x="14" y="7" width="3" height="3"/>
                <rect x="7" y="14" width="3" height="3"/>
                <path d="M14 14h3v3h-3z"/>
              </svg>
              二维码
            </button>
          </div>
          <p class="mobile-hint">左右滑动切换小票</p>
        </div>

        <div class="scanner-footer">
          <div class="footer-btns">
            <button
              class="btn-nav"
              :disabled="currentIndex === 0"
              @click="currentIndex--"
            >
              ‹ 上一张
            </button>
            <button
              :class="['btn-abnormal', { disabled: currentReceipt?.isAbnormal }]"
              :disabled="currentReceipt?.isAbnormal"
              @click="markAbnormal"
            >
              {{ currentReceipt?.isAbnormal ? '已标记' : '异常' }}
            </button>
            <button
              class="btn-nav"
              :disabled="currentIndex === receipts.length - 1"
              @click="currentIndex++"
            >
              下一张 ›
            </button>
          </div>
          <p class="shortcuts">快捷键：← → 切换 | 空格 切换码 | E 标记异常</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { loadData, updateReceipt } from '../utils/receiptStorage.js';

const route = useRoute();
const ownerId = computed(() => route.params.ownerId ?? '');

const receipts = ref([]);
const owners = ref([]);
const currentIndex = ref(0);
const includeUnassigned = ref(null);
const codeType = ref('barcode');

// 管理所有 Slide 的 Canvas 引用
const qrRefs = ref([]);
const barcodeRefs = ref([]);
const swiperInstance = ref(null);

const setQrRef = (el, index) => {
  if (el) qrRefs.value[index] = el;
};
const setBarcodeRef = (el, index) => {
  if (el) barcodeRefs.value[index] = el;
};

const onSwiperInit = (swiper) => {
  swiperInstance.value = swiper;
};

const onSlideChange = (swiper) => {
  currentIndex.value = swiper.activeIndex;
};

// 监听 currentIndex 变化同步 Swiper (如果是通过按钮切换时)
watch(currentIndex, (newIndex) => {
  if (swiperInstance.value && swiperInstance.value.activeIndex !== newIndex) {
    swiperInstance.value.slideTo(newIndex);
  }
});

const ownerName = computed(() => {
  if (!ownerId.value) return '未指定持有人';
  const o = owners.value.find((x) => x.id === ownerId.value);
  return o?.name || '未知';
});

const currentReceipt = computed(() => receipts.value[currentIndex.value]);

const handleConfirmMode = (include) => {
  includeUnassigned.value = include;
};

const toggleCodeType = () => {
  codeType.value = codeType.value === 'qr' ? 'barcode' : 'qr';
};

const markAbnormal = () => {
  if (!currentReceipt.value) return;
  updateReceipt(currentReceipt.value.id, { isAbnormal: true });
  ElMessage.success('已标记为异常');
  receipts.value = receipts.value.map((r) =>
    r.id === currentReceipt.value.id ? { ...r, isAbnormal: true } : r
  );
  if (currentIndex.value < receipts.value.length - 1) {
    currentIndex.value++;
  }
};

const generateCodes = async () => {
  if (receipts.value.length === 0) return;
  await nextTick();
  
  receipts.value.forEach(async (receipt, index) => {
    try {
      const qrEl = qrRefs.value[index];
      const barcodeEl = barcodeRefs.value[index];

      if (qrEl) {
        await QRCode.toCanvas(qrEl, receipt.ticketNumber, {
          width: 400,
          margin: 2
        });
      }
      if (barcodeEl) {
        JsBarcode(barcodeEl, receipt.ticketNumber, {
          format: 'CODE128',
          width: 3,
          height: 150,
          displayValue: true,
          fontSize: 20,
          margin: 10
        });
      }
    } catch (err) {
      console.error(`Code generation error for slide ${index}:`, err);
    }
  });
};

// 监听 receipts 变化重新生成码
watch(receipts, generateCodes, { deep: true });
// 监听模式确认
watch(includeUnassigned, (val) => {
  if (val !== null) generateCodes();
});

const handleKeyDown = (e) => {
  if (includeUnassigned.value === null || receipts.value.length === 0) return;
  if (e.key === 'ArrowLeft' && currentIndex.value > 0) currentIndex.value--;
  else if (e.key === 'ArrowRight' && currentIndex.value < receipts.value.length - 1)
    currentIndex.value++;
  else if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    toggleCodeType();
  } else if (e.key === 'e' || e.key === 'E') markAbnormal();
};

const loadReceipts = () => {
  if (includeUnassigned.value === null) return;
  const data = loadData();
  let filtered = data.receipts;
  if (ownerId.value === '') {
    filtered = filtered.filter((r) => !r.owner);
  } else {
    filtered = filtered.filter((r) => r.owner === ownerId.value);
    if (includeUnassigned.value) {
      const unassigned = data.receipts.filter((r) => !r.owner);
      filtered = [...filtered, ...unassigned];
    }
  }
  receipts.value = filtered;
};

watch([ownerId, includeUnassigned], loadReceipts, { immediate: true });

onMounted(() => {
  const data = loadData();
  owners.value = data.owners;
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.receipt-scanner-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #1e3a8a, #581c87, #831843);
}

.mode-dialog {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.mode-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  padding: 2rem;
  max-width: 28rem;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.mode-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6, #a855f7);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
}

.mode-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #2563eb, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.75rem;
}

.mode-desc, .mode-hint {
  color: #374151;
  margin: 0 0 0.5rem;
}

.mode-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.highlight {
  font-weight: 600;
  color: #2563eb;
}

.mode-btns {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-mode {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-mode.primary {
  background: linear-gradient(to right, #3b82f6, #a855f7);
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.btn-mode.outline {
  background: white;
  border: 2px solid #e5e7eb;
  color: #374151;
}

.btn-mode.ghost {
  background: transparent;
  color: #6b7280;
}

.mode-card.empty .empty-icon {
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #9ca3af;
  margin: 0 auto 1.5rem;
}

.scanner-main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative; /* 为绝对定位的 warning 提供参照 */
}

.scanner-header {
  height: 64px; /* 固定高度，不再由 padding 撑开 */
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.btn-back {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 8px;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
}

.header-center {
  text-align: center;
}

.owner-badge {
  color: white;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  50% { opacity: 0.5; }
}

.count-badge {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
}

.header-spacer {
  width: 40px;
}

.owner-warning {
  position: absolute;
  top: 64px; /* 紧贴固定为 64px 的 header 下方 */
  left: 0;
  right: 0;
  z-index: 50;
  background: linear-gradient(to right, #facc15, #fb923c);
  padding: 0.75rem 1rem;
  text-align: center;
  color: #78350f;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* 加强阴影，让层次感更分明 */
}

.code-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  min-height: 460px;
  overflow: hidden;
  width: 100%;
}

.scanner-swiper {
  width: 100%;
  height: 100%;
  padding: 1rem 0;
}

.slide-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.code-card-container {
  perspective: 1000px;
  width: 320px;
  height: 320px;
  margin-bottom: 1rem;
  cursor: pointer;
  z-index: 10;
}

.code-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: transparent;
}

/* 移除旧的滑动动画 */
.slide-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}


.code-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.code-card-inner.flipped {
  transform: rotateY(180deg);
}

.code-card-front, .code-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.code-card-back {
  transform: rotateY(180deg);
}

.code-card-front canvas, .code-card-back canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.code-ticket {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  margin: 0 0 1.5rem;
  text-align: center;
}

/* 切换器样式优化 */
.code-switch-container {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 6px;
  border-radius: 16px;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-btn svg {
  opacity: 0.7;
}

.switch-btn.active {
  background: white;
  color: #1e3a8a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.switch-btn.active svg {
  opacity: 1;
}

.mobile-hint {
  display: none;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .mobile-hint {
    display: block;
  }
  .shortcuts {
    display: none;
  }
}

.scanner-footer {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-btns {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.btn-nav {
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-abnormal {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #ef4444, #f97316);
  border: none;
  color: white;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-abnormal:hover:not(.disabled):not(:disabled) {
  filter: brightness(1.1);
}

.btn-abnormal.disabled,
.btn-abnormal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shortcuts {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  text-align: center;
}
</style>
