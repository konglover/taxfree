import { 
  getAllDatabases as getDBList, 
  createDatabase as createDB, 
  deleteDatabase as deleteDB 
} from '../config/database-manager.js';

// 获取所有数据库列表
export const getAllDatabases = async (req, res) => {
  try {
    const databases = getDBList();
    res.json({ success: true, data: databases });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch databases' });
  }
};

// 创建新数据库
export const createDatabase = async (req, res) => {
  try {
    const { dbName } = req.body;
    
    if (!dbName || typeof dbName !== 'string') {
      return res.status(400).json({ success: false, error: 'Database name is required' });
    }

    // 验证数据库名称（只允许字母、数字、下划线、连字符）
    if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database name can only contain letters, numbers, underscores, and hyphens' 
      });
    }

    const db = createDB(dbName);
    res.status(201).json({ 
      success: true, 
      message: `Database "${dbName}" created successfully`,
      data: { dbName }
    });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ success: false, error: 'Failed to create database' });
  }
};

// 删除数据库
export const deleteDatabase = async (req, res) => {
  try {
    const { dbName } = req.params;
    
    if (!dbName) {
      return res.status(400).json({ success: false, error: 'Database name is required' });
    }

    // 防止删除默认数据库
    if (dbName === 'taxfree') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the default database' 
      });
    }

    deleteDB(dbName);
    res.json({ success: true, message: `Database "${dbName}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ success: false, error: 'Failed to delete database' });
  }
};

















