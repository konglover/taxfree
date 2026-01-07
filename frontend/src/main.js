import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import './style.css';

// 引入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 初始化认证状态
import { useAuthStore } from './stores/auth.js';
const authStore = useAuthStore();
authStore.initAuth();
app.use(ElementPlus, {
  locale: zhCn,
});

app.mount('#app');

// 禁止页面缩放
(function() {
  // 禁用双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // 禁用手势缩放
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
  });
  document.addEventListener('gestureend', function(e) {
    e.preventDefault();
  });

  // 禁用 Ctrl + 滚轮缩放
  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // 禁用 Ctrl + +/- 缩放
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.keyCode === 187 || e.keyCode === 189)) {
      e.preventDefault();
    }
  });
})();

















