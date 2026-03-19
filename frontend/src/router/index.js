import { createRouter, createWebHistory } from 'vue-router';
import ReceiptList from '../views/ReceiptList.vue';
import ReceiptInput from '../views/ReceiptInput.vue';
import ReceiptScanner from '../views/ReceiptScanner.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'ReceiptList',
      component: ReceiptList
    },
    {
      path: '/input',
      name: 'ReceiptInput',
      component: ReceiptInput
    },
    {
      path: '/scanner/:ownerId?',
      name: 'ReceiptScanner',
      component: ReceiptScanner,
      props: true
    }
  ]
});

export default router;
