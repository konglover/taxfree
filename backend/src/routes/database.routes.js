import { Router } from 'express';
import { 
  getAllDatabases, 
  createDatabase, 
  deleteDatabase
} from '../controllers/database.controller.js';

const router = Router();

// 获取所有数据库列表
router.get('/', getAllDatabases);

// 创建新数据库
router.post('/', createDatabase);

// 删除数据库
router.delete('/:dbName', deleteDatabase);

export default router;

