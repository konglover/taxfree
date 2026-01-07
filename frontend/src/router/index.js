import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import Cards from '../views/Cards.vue';
import Scan from '../views/Scan.vue';
import Home from '../views/Home.vue';
import Users from '../views/Users.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import DatabaseViewer from '../db-viewer/DatabaseViewer.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cards'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { requiresGuest: true }
    },
    {
      path: '/cards',
      name: 'Cards',
      component: Cards,
      meta: { requiresAuth: true }
    },
    {
      path: '/scan',
      name: 'Scan',
      component: Scan,
      meta: { requiresAuth: true }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'Users',
      component: Users,
      meta: { requiresAuth: true }
    },
    {
      path: '/db-viewer',
      name: 'DatabaseViewer',
      component: DatabaseViewer,
      meta: { requiresAuth: true }
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  // 已登录用户访问登录/注册页，重定向到首页
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Cards' });
    return;
  }
  
  next();
});

export default router;

