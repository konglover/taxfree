<template>
  <Teleport to="body">
    <div v-if="modelValue" class="scan-dialog-overlay" @click="close">
      <div class="scan-dialog" @click.stop>
        <div class="scan-header">
          <h1>扫描小票</h1>
          <button @click="close" class="btn-close">×</button>
        </div>

    <div class="scan-container">
      <div v-if="cameraError" class="error-banner">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <div class="error-text">
            <strong>摄像头错误</strong>
            <p>{{ cameraError }}</p>
          </div>
          <button @click="cameraError = ''" class="btn-close-error">×</button>
        </div>
      </div>

      <div v-if="!isScanning && !scannedResult" class="scan-placeholder">
        <div class="scan-icon">📷</div>
        <p>点击下方按钮开始扫描</p>
        <button @click="startScan" class="btn-scan">开始扫描</button>
      </div>

      <div v-else-if="isScanning" class="scanner-wrapper">
        <div :id="`qr-reader-${scanId}`" class="qr-reader"></div>
        <div class="scan-overlay">
          <div class="scan-frame"></div>
          <p class="scan-hint">将一维码对准摄像头，保持稳定</p>
        </div>
        <div class="scan-controls">
          <button v-if="availableCameras.length > 1" @click="switchCamera" class="btn-switch-camera" title="切换摄像头">
            <span class="btn-icon">🔄</span>
            <span>切换摄像头</span>
          </button>
          <button @click="stopScan" class="btn-stop" title="停止扫描">
            <span class="btn-icon">⏹️</span>
            <span>停止扫描</span>
          </button>
        </div>
      </div>

      <div v-if="saveSuccess" class="success-banner">
        <div class="success-content">
          <span class="success-icon">✅</span>
          <div class="success-text">
            <strong>保存成功</strong>
            <p>{{ saveSuccess }}</p>
          </div>
        </div>
      </div>

      <div v-if="saveError" class="error-banner">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <div class="error-text">
            <strong>保存失败</strong>
            <p>{{ saveError }}</p>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #999;">
              请检查：1. 网络连接是否正常 2. 后端服务是否运行 3. 浏览器控制台是否有错误信息
            </p>
          </div>
          <button @click="saveError = ''" class="btn-close-error">×</button>
        </div>
        <div class="error-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <button @click="retrySave" class="btn-retry" :disabled="saving">
            {{ saving ? '重试中...' : '重试保存' }}
          </button>
          <button @click="scanAgain" class="btn-rescan-small">重新扫描</button>
        </div>
      </div>

      <div v-if="scannedResult && !showSaveModal && !saving" class="scan-result">
        <h3>✅ 扫描成功！</h3>
        <div class="result-info">
          <p><strong>一维码：</strong>{{ scannedResult }}</p>
        </div>
        <div class="result-actions" v-if="saveError">
          <button @click="saveCard" class="btn-save">手动保存</button>
          <button @click="scanAgain" class="btn-rescan">重新扫描</button>
        </div>
      </div>

      <div v-if="saving" class="saving-indicator">
        <div class="saving-content">
          <span class="saving-spinner">⏳</span>
          <p>正在保存一维码到数据库...</p>
        </div>
      </div>
    </div>

    <!-- 保存卡包模态框 -->
    <div v-if="showSaveModal" class="modal-overlay" @click="closeSaveModal">
      <div class="modal-content" @click.stop>
        <h2>保存到卡包</h2>
        <p class="modal-hint">一维码已自动填充，您可以选择快速保存或填写详细信息</p>
        <form @submit.prevent="submitCard">
          <div class="form-group">
            <label>一维码 *</label>
            <input v-model="cardForm.barcode" type="text" required readonly class="form-input" />
          </div>
          <div class="form-group">
            <label>名称</label>
            <input v-model="cardForm.name" type="text" placeholder="例如：购物小票" class="form-input" />
          </div>
          <div class="form-group">
            <label>商家</label>
            <input v-model="cardForm.merchant" type="text" placeholder="例如：超市名称" class="form-input" />
          </div>
          <div class="form-group">
            <label>金额</label>
            <input v-model="cardForm.amount" type="number" step="0.01" placeholder="0.00" class="form-input" />
          </div>
          <div class="form-group">
            <label>日期</label>
            <input v-model="cardForm.date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="cardForm.note" placeholder="添加备注信息" class="form-textarea"></textarea>
          </div>
          <div v-if="saveError" class="error-text">{{ saveError }}</div>
          <div class="form-actions">
            <button type="button" @click="closeSaveModal" class="btn btn-cancel">取消</button>
            <button type="button" @click="quickSave" class="btn btn-quick" :disabled="saving">
              {{ saving ? '保存中...' : '快速保存' }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { cardsService } from '../services/cards.service.js';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'saved', 'scanned']);

const close = () => {
  if (isScanning.value) {
    stopScan();
  }
  emit('update:modelValue', false);
};
const isScanning = ref(false);
const scannedResult = ref('');
const showSaveModal = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref('');
const cameraError = ref('');
const availableCameras = ref([]);
const rearCameras = ref([]); // 所有后置摄像头
const selectedCameraId = ref('');
const currentCameraIndex = ref(0);
const scanId = ref(Date.now());
let html5QrCode = null;

const cardForm = ref({
  barcode: '',
  name: '',
  merchant: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  note: ''
});

// 检查浏览器是否支持摄像头
const checkCameraSupport = () => {
  // 检查基础 API 支持
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, reason: '浏览器不支持摄像头 API' };
  }
  
  // 检查协议要求（移动端必须 HTTPS 或 localhost）
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const isHttps = protocol === 'https:';
  const isHttp = protocol === 'http:';
  
  // 移动端浏览器要求 HTTPS（localhost 除外）
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile && !isHttps && !isLocalhost) {
    return { 
      supported: false, 
      reason: '移动端浏览器需要 HTTPS 协议才能访问摄像头。\n\n解决方案：\n1. 使用 HTTPS 访问（推荐）\n2. 或通过 localhost 访问\n3. 或使用电脑浏览器通过 IP 地址访问' 
    };
  }
  
  return { supported: true };
};

// 检测摄像头信息（是否为后置、分辨率等）- 简化版，避免过度检测
const detectCameraInfo = async (deviceId, label) => {
  let isRear = false;
  let maxResolution = '未知';
  
  // 通过标签判断（不打开摄像头，避免权限问题）
  const labelLower = (label || '').toLowerCase();
  isRear = labelLower.includes('back') || 
           labelLower.includes('rear') || 
           labelLower.includes('environment') ||
           labelLower.includes('后置') ||
           labelLower.includes('背面');
  
  // 不主动打开摄像头检测分辨率，避免权限和资源问题
  // 只在用户选择摄像头后再获取实际分辨率
  maxResolution = '检测中';
  
  return { isRear, maxResolution };
};

// 获取可用的摄像头列表并识别后置摄像头（简化版）
const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length === 0) {
      availableCameras.value = [];
      rearCameras.value = [];
      return [];
    }
    
    // 快速检测（只通过标签，不打开摄像头，避免权限问题）
    const camerasWithInfo = videoDevices.map(device => {
      // 通过标签判断（同步，不打开摄像头）
      const labelLower = (device.label || '').toLowerCase();
      const isRear = labelLower.includes('back') || 
                     labelLower.includes('rear') || 
                     labelLower.includes('environment') ||
                     labelLower.includes('后置') ||
                     labelLower.includes('背面');
      
      return {
        ...device,
        isRear: isRear,
        maxResolution: '自动'
      };
    });
    
    // 分离后置摄像头和其他摄像头
    const rearCams = camerasWithInfo.filter(cam => cam.isRear);
    const otherCams = camerasWithInfo.filter(cam => !cam.isRear);
    
    rearCameras.value = rearCams;
    availableCameras.value = [...rearCams, ...otherCams];
    
    // 默认选择第一个后置摄像头（如果有的话），否则选择第一个
    if (rearCams.length > 0) {
      selectedCameraId.value = rearCams[0].deviceId;
      currentCameraIndex.value = availableCameras.value.findIndex(c => c.deviceId === rearCams[0].deviceId);
    } else if (availableCameras.value.length > 0) {
      selectedCameraId.value = availableCameras.value[0].deviceId;
      currentCameraIndex.value = 0;
    }
    
    return availableCameras.value;
  } catch (err) {
    availableCameras.value = [];
    rearCameras.value = [];
    return [];
  }
};

// 尝试启动摄像头（支持多种配置，优化清晰度）
const tryStartCamera = async (cameraConfig, attempt = 1) => {
  try {
    // 先清理旧的实例（如果存在）
    if (html5QrCode) {
      try {
        await html5QrCode.stop().catch(() => {});
        html5QrCode.clear();
      } catch (e) {
        // 忽略清理错误
      }
      html5QrCode = null;
    }

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
      // 检查解码结果
      if (!decodedText || decodedText.trim() === '') {
        return;
      }
      
      // 防止重复触发（如果已经有扫描结果或正在保存，则忽略）
      if (scannedResult.value || saving.value) {
        console.log('跳过重复的扫描结果');
        return;
      }
      
      // 先停止扫描
      if (html5QrCode) {
        try {
          await html5QrCode.stop().catch(() => {});
          html5QrCode.clear();
        } catch (e) {
          // 忽略错误
        }
        html5QrCode = null;
      }
      
      // 更新状态 - 确保响应式更新
      isScanning.value = false;
      const barcode = decodedText.trim();
      scannedResult.value = barcode;
      
      console.log('识别到一维码:', barcode);
      
      // 扫描成功后，通知父组件，让父组件打开添加卡包模态框
      emit('scanned', barcode);
      
      // 停止扫描并关闭对话框
      if (html5QrCode) {
        try {
          await html5QrCode.stop().catch(() => {});
          html5QrCode.clear();
        } catch (e) {
          // 忽略错误
        }
        html5QrCode = null;
      }
      
      // 关闭扫描对话框
      close();
    };

    // 配置支持一维码格式
    // 注意：html5-qrcode库对一维码的支持可能有限，优先使用浏览器原生BarcodeDetector API
    const readerId = `qr-reader-${Date.now()}`;
    html5QrCode = new Html5Qrcode(`qr-reader-${scanId.value}`, {
      formatsToSupport: [
        // 一维码格式
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        // 二维码
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,  // 关闭详细日志，避免性能问题
      useBarCodeDetectorIfSupported: true  // 优先使用浏览器原生BarcodeDetector API
    });
    
    // 一维码扫描配置
    // 对于一维码，不设置qrbox限制，扫描整个视频区域效果更好
    const scanConfig = {
      fps: 10,
      // 不设置qrbox，让扫描整个视频区域（对一维码识别更有效）
      // 一维码是横向的，需要扫描整个宽度才能识别
      aspectRatio: 1.0,
      disableFlip: false
    };
    
    // 准备摄像头配置（html5-qrcode 的格式）
    let finalConfig = cameraConfig;
    if (typeof cameraConfig === 'object' && cameraConfig.deviceId) {
      // html5-qrcode 支持 deviceId 对象格式
      if (cameraConfig.deviceId.exact) {
        finalConfig = cameraConfig.deviceId.exact;
      } else {
        finalConfig = cameraConfig.deviceId;
      }
    }
    
    try {
      await html5QrCode.start(
        finalConfig,
        scanConfig,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // 扫描错误（非摄像头错误），这是正常的，表示还没识别到码
          // 只在verbose模式下输出，避免控制台刷屏
          // console.log('扫描中:', errorMessage);
        }
      );
      
      console.log('扫描器已启动，等待识别一维码...');
    } catch (startError) {
      throw startError;
    }
    
    // 尝试应用对焦和缩放设置
    try {
      const videoElement = document.querySelector(`#qr-reader-${scanId.value} video`);
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities();
          const settings = videoTrack.getSettings();
          
          // 尝试设置对焦
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            }).catch(() => {});
          }
          
          // 尝试设置缩放
          if (capabilities.zoom) {
            const maxZoom = capabilities.zoom.max || 2;
            videoTrack.applyConstraints({
              advanced: [{ zoom: Math.min(maxZoom, 2) }]
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      // 静默处理，不输出日志
    }
    
    return true;
  } catch (err) {
    // 清理失败的实例
    if (html5QrCode) {
      try {
        await html5QrCode.stop().catch(() => {});
        html5QrCode.clear();
      } catch (e) {
        // 静默处理
      }
      html5QrCode = null;
    }
    
    return false;
  }
};

const startScan = async () => {
  // 先停止之前的扫描（如果正在扫描）
  if (isScanning.value) {
    await stopScan();
    // 等待一小段时间确保完全停止
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 清空之前的扫描结果和成功提示
  scannedResult.value = '';
  saveSuccess.value = '';
  saveError.value = '';
  cameraError.value = '';
  showSaveModal.value = false;
  saving.value = false;
  
  // 检查浏览器支持
  const supportCheck = checkCameraSupport();
  if (!supportCheck.supported) {
    cameraError.value = supportCheck.reason || '您的浏览器不支持摄像头访问功能，请使用现代浏览器（Chrome、Firefox、Edge等）';
    return;
  }

  try {
    // 确保 html5QrCode 已清理
    if (html5QrCode) {
      try {
        await html5QrCode.stop().catch(() => {});
        html5QrCode.clear();
      } catch (e) {
        // 忽略错误
      }
      html5QrCode = null;
    }
    
    isScanning.value = true;

    // 先请求摄像头权限（通过尝试访问摄像头）
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment', // 优先使用后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      // 立即停止流，我们只是用来请求权限
      stream.getTracks().forEach(track => track.stop());
    } catch (permErr) {
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        cameraError.value = '摄像头权限被拒绝。请点击浏览器地址栏的摄像头图标，允许访问摄像头权限。';
        isScanning.value = false;
        return;
      } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
        cameraError.value = '未找到摄像头设备，请检查设备是否连接了摄像头。';
        isScanning.value = false;
        return;
      } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
        cameraError.value = '摄像头被占用或无法访问，请关闭其他使用摄像头的应用后重试。';
        isScanning.value = false;
        return;
      } else {
        // 其他错误，继续尝试，可能只是配置问题
        console.warn('摄像头权限请求警告:', permErr);
      }
    }

    // 获取摄像头列表（需要先有权限，但不显示选择器）
    const cameras = await getCameras();
    
    if (cameras.length === 0) {
      cameraError.value = '未检测到可用的摄像头设备';
      isScanning.value = false;
      return;
    }

    // 尝试多种摄像头配置（简化，确保兼容性）
    const cameraConfigs = [];
    
    // 如果用户选择了特定摄像头，优先使用
    if (selectedCameraId.value) {
      cameraConfigs.push({ deviceId: { exact: selectedCameraId.value } });
      cameraConfigs.push(selectedCameraId.value); // 也尝试直接传 deviceId 字符串
    }
    
    // 如果没有选择，优先尝试所有后置摄像头
    if (!selectedCameraId.value && rearCameras.value.length > 0) {
      for (const rearCam of rearCameras.value) {
        cameraConfigs.push({ deviceId: { exact: rearCam.deviceId } });
        cameraConfigs.push(rearCam.deviceId);
      }
    }
    
    // 如果后置摄像头都失败，尝试使用 facingMode
    cameraConfigs.push(
      { facingMode: 'environment' }, // 后置摄像头
      'environment' // 简写形式
    );
    
    // 最后尝试前置摄像头
    cameraConfigs.push(
      { facingMode: 'user' }, // 前置摄像头
      'user' // 简写形式
    );

    let success = false;
    for (let i = 0; i < cameraConfigs.length; i++) {
      const config = cameraConfigs[i];
      success = await tryStartCamera(config, i + 1);
      if (success) {
        break;
      } else {
        // 如果失败，继续尝试下一个配置
      }
    }

    if (!success) {
      cameraError.value = '无法启动摄像头。请检查：\n1. 浏览器是否已授予摄像头权限\n2. 摄像头是否被其他应用占用\n3. 设备是否连接了摄像头';
      isScanning.value = false;
    }
  } catch (err) {
    let errorMsg = '无法启动摄像头';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMsg = '未找到摄像头设备';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMsg = '摄像头被占用或无法访问，请关闭其他使用摄像头的应用';
    } else if (err.message) {
      errorMsg = err.message;
    }
    
    cameraError.value = errorMsg;
    isScanning.value = false;
  }
};

const stopScan = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (err) {
      // 静默处理
    }
    html5QrCode = null;
  }
  isScanning.value = false;
};

// 重试保存
const retrySave = async () => {
  if (scannedResult.value) {
    await autoSaveBarcode(scannedResult.value);
  }
};

const scanAgain = () => {
  scannedResult.value = '';
  showSaveModal.value = false;
  saveError.value = '';
  saveSuccess.value = '';
  saving.value = false;
  startScan();
};

// 切换摄像头
const switchCamera = async () => {
  if (availableCameras.value.length <= 1) {
    return;
  }
  
  // 停止当前摄像头
  await stopScan();
  
  // 切换到下一个摄像头
  currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length;
  selectedCameraId.value = availableCameras.value[currentCameraIndex.value].deviceId;
  
  // 重新启动扫描
  await startScan();
};

const saveCard = () => {
  // 重置表单并填充一维码
  cardForm.value = {
    barcode: scannedResult.value,
    name: '',
    merchant: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  };
  saveError.value = '';
  showSaveModal.value = true;
};

// 自动保存一维码到数据库（识别后直接保存）
const autoSaveBarcode = async (barcode) => {
  saving.value = true;
  saveError.value = '';
  saveSuccess.value = '';

  try {
    console.log('开始保存一维码到数据库:', barcode);
    
    const cardData = {
      barcode: barcode,
      name: '',
      merchant: '',
      amount: null,
      date: new Date().toISOString().split('T')[0],
      note: ''
    };

    console.log('发送数据:', cardData);
    
    const response = await cardsService.createCard(cardData);
    
    console.log('API响应:', response);
    
    // 保存成功，显示成功提示
    saveSuccess.value = `一维码 ${barcode} 已保存到数据库`;
    console.log('✅ 一维码已保存到数据库:', barcode);
    emit('saved');
    
    // 2秒后清空结果和提示，允许继续扫描
    setTimeout(async () => {
      // 确保所有状态都已重置
      scannedResult.value = '';
      saveSuccess.value = '';
      saveError.value = '';
      saving.value = false;
      showSaveModal.value = false;
      
      // 确保扫描器已完全停止
      if (html5QrCode) {
        try {
          await html5QrCode.stop().catch(() => {});
          html5QrCode.clear();
        } catch (e) {
          // 忽略错误
        }
        html5QrCode = null;
      }
      
      // 自动重新开始扫描
      await startScan();
    }, 2000);
  } catch (err) {
    saving.value = false;
    
    // 详细错误日志
    console.error('❌ 保存失败，错误详情:', {
      message: err.message,
      response: err.response,
      responseData: err.response?.data,
      responseStatus: err.response?.status,
      stack: err.stack
    });
    
    // 检查是否是一维码已存在的情况（应该视为成功）
    let errorMessage = '保存失败';
    
    if (err.response) {
      // 服务器返回了响应（有状态码）
      errorMessage = err.response.data?.error || err.response.statusText || `服务器错误 (${err.response.status})`;
    } else if (err.request) {
      // 请求已发送但没有收到响应
      errorMessage = '无法连接到服务器，请检查：1. 后端服务是否运行 2. 网络连接是否正常';
      console.error('网络错误 - 请求已发送但未收到响应:', err.request);
    } else {
      // 其他错误
      errorMessage = err.message || '未知错误';
    }
    
    // 检查是否是一维码已存在的情况（应该视为成功）
    if (errorMessage.includes('already exists') || errorMessage.includes('已存在') || errorMessage.includes('Barcode already exists')) {
      // 一维码已存在，视为成功
      saveSuccess.value = `一维码 ${barcode} 已存在于数据库中`;
      console.log('ℹ️ 一维码已存在:', barcode);
      
      // 2秒后清空结果和提示，允许继续扫描
      setTimeout(async () => {
        // 确保所有状态都已重置
        scannedResult.value = '';
        saveSuccess.value = '';
        saveError.value = '';
        saving.value = false;
        showSaveModal.value = false;
        
        // 确保扫描器已完全停止
        if (html5QrCode) {
          try {
            await html5QrCode.stop().catch(() => {});
            html5QrCode.clear();
          } catch (e) {
            // 忽略错误
          }
          html5QrCode = null;
        }
        
        // 自动重新开始扫描
        await startScan();
      }, 2000);
    } else {
      // 其他错误，显示错误信息
      saveError.value = errorMessage;
      console.error('保存失败:', errorMessage, err);
    }
  }
};

// 快速保存（只保存一维码）
const quickSave = async () => {
  saving.value = true;
  saveError.value = '';

  try {
    const cardData = {
      barcode: scannedResult.value,
      name: '',
      merchant: '',
      amount: null,
      date: new Date().toISOString().split('T')[0],
      note: ''
    };

    await cardsService.createCard(cardData);
    
    // 保存成功，关闭模态框并通知父组件
    showSaveModal.value = false;
    emit('saved');
    close();
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const submitCard = async () => {
  saving.value = true;
  saveError.value = '';

  try {
    const cardData = {
      ...cardForm.value,
      amount: cardForm.value.amount ? parseFloat(cardForm.value.amount) : null
    };

    await cardsService.createCard(cardData);
    
    // 保存成功，关闭模态框并通知父组件
    showSaveModal.value = false;
    emit('saved');
    close();
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const closeSaveModal = () => {
  showSaveModal.value = false;
  saveError.value = '';
  // 关闭模态框后不清空扫描结果，方便用户重新打开
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    scanId.value = Date.now();
  } else {
    stopScan();
  }
});

onMounted(async () => {
  // 页面加载时不主动获取摄像头列表，避免显示过多信息
  // 只在用户点击开始扫描时再获取
});

onUnmounted(() => {
  if (html5QrCode) {
    stopScan();
  }
});
</script>

<style scoped>
.scan-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
}

.scan-dialog {
  background: #f5f5f5;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scan-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.scan-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.scan-container {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.scan-placeholder {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  margin-top: 2rem;
}

.scan-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.scan-placeholder p {
  color: #666;
  margin-bottom: 2rem;
}

.success-banner {
  background: #efe;
  border: 1px solid #8f8;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.success-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.success-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.success-text {
  flex: 1;
}

.success-text strong {
  display: block;
  color: #3a3;
  margin-bottom: 0.5rem;
}

.success-text p {
  margin: 0;
  color: #666;
  white-space: pre-line;
  font-size: 0.9rem;
}

.error-banner {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

.error-text strong {
  display: block;
  color: #c33;
  margin-bottom: 0.5rem;
}

.error-text p {
  margin: 0;
  color: #666;
  white-space: pre-line;
  font-size: 0.9rem;
}

.saving-indicator {
  background: white;
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 2rem;
  margin: 1rem 0;
  text-align: center;
}

.saving-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.saving-spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.saving-content p {
  margin: 0;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 500;
}

.btn-close-error {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-close-error:hover {
  color: #666;
}

.camera-selector {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.camera-group {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.camera-group-label {
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
}

.camera-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  width: 100%;
}

.camera-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-scan {
  background: #667eea;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  font-weight: 600;
}

.scanner-wrapper {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 1rem;
}

#qr-reader {
  width: 100%;
  min-height: 400px;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.scan-frame {
  width: 400px;
  height: 200px;
  border: 2px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .scan-frame {
    width: 90%;
    max-width: 350px;
    height: 150px;
  }
}

.scan-hint {
  color: white;
  margin-top: 1rem;
  margin-bottom: 5rem;
  font-size: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 0 1rem;
}

.scan-controls {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 10;
  align-items: center;
  width: 100%;
  max-width: 200px;
}

.btn-switch-camera {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  width: 100%;
}

.btn-switch-camera:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-switch-camera:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-stop {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  border: none;
  padding: 0.875rem 2.25rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-stop:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 101, 101, 0.5);
}

.btn-stop:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.4);
}

.btn-icon {
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.scan-result {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.scan-result h3 {
  color: #48bb78;
  margin: 0 0 1rem 0;
}

.result-info {
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.result-info p {
  margin: 0;
  word-break: break-all;
}

.result-actions {
  display: flex;
  gap: 1rem;
}

.btn-save,
.btn-rescan {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-save {
  background: #48bb78;
  color: white;
}

.btn-rescan {
  background: #667eea;
  color: white;
}

/* 模态框样式 */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.modal-hint {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.error-text {
  color: #f56565;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e2e8f0;
  color: #333;
}

.btn-quick {
  background: #48bb78;
  color: white;
}

.btn-quick:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-retry {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-rescan-small {
  background: #48bb78;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>



