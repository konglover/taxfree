import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import dbRoutes from './routes/db.routes.js';
import authRoutes from './routes/auth.routes.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/cards', (await import('./routes/cards.routes.js')).default);

// 数据库管理路由
import databaseRoutes from './routes/database.routes.js';
app.use('/api/databases', databaseRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  // 数据库连接已在 database.js 中初始化
});

