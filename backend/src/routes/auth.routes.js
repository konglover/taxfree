import express from 'express';
import { register, login, getCurrentUser, authenticateToken } from '../controllers/auth.controller.js';

const router = express.Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, getCurrentUser);

export default router;






