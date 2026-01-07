import { db } from '../config/database-manager.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 用户注册
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 验证必填字段
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '姓名、邮箱和密码都是必填项' 
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: '邮箱格式不正确' 
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: '密码长度至少为6位' 
      });
    }

    // 检查邮箱是否已存在
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = checkStmt.get(email);
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: '该邮箱已被注册' 
      });
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword);

    // 生成 JWT token
    const token = jwt.sign(
      { id: result.lastInsertRowid, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          name,
          email
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '注册失败，请稍后重试' 
    });
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '邮箱和密码都是必填项' 
      });
    }

    // 查找用户
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: '邮箱或密码错误' 
      });
    }

    // 验证密码
    if (!user.password) {
      return res.status(401).json({ 
        success: false, 
        error: '该账户未设置密码，请先注册' 
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: '邮箱或密码错误' 
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '登录失败，请稍后重试' 
    });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
    const user = stmt.get(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取用户信息失败' 
    });
  }
};

// JWT 验证中间件
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供认证令牌' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: '令牌无效或已过期' 
      });
    }
    req.user = user;
    next();
  });
};

