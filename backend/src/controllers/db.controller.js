import { getDatabase } from '../config/database-manager.js';

// 获取所有表名
export const getTables = async (req, res) => {
  try {
    // 支持指定数据库，默认为 taxfree
    const dbName = req.query.db || 'taxfree';
    const db = getDatabase(dbName);
    
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    const tableNames = tables.map(table => table.name);
    res.json({ success: true, data: tableNames, dbName });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
};

// 获取表结构
export const getTableStructure = async (req, res) => {
  try {
    const { tableName } = req.params;
    const dbName = req.query.db || 'taxfree';
    const db = getDatabase(dbName);
    
    // 验证表名，防止 SQL 注入
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).all(tableName);
    
    if (tables.length === 0) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    
    // 获取表结构信息
    const pragma = db.prepare(`PRAGMA table_info(${tableName})`);
    const columns = pragma.all();
    
    // 格式化列信息
    const structure = columns.map(col => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull === 1,
      dflt_value: col.dflt_value,
      pk: col.pk === 1
    }));
    
    res.json({ success: true, data: structure });
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table structure' });
  }
};

// 获取表数据
export const getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const dbName = req.query.db || 'taxfree';
    const db = getDatabase(dbName);
    
    // 验证表名
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).all(tableName);
    
    if (tables.length === 0) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    
    // 获取表数据（限制最多 1000 条，避免数据过大）
    const stmt = db.prepare(`SELECT * FROM ${tableName} LIMIT 1000`);
    const data = stmt.all();
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table data' });
  }
};

