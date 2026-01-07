import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保 data 目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库连接池（存储多个数据库连接）
const databases = new Map();

// 默认数据库
const defaultDbName = 'taxfree';

/**
 * 获取或创建数据库连接
 * @param {string} dbName - 数据库名称（不含 .db 扩展名）
 * @returns {Database} SQLite 数据库连接
 */
export const getDatabase = (dbName = defaultDbName) => {
  // 如果已存在连接，直接返回
  if (databases.has(dbName)) {
    return databases.get(dbName);
  }

  // 创建新的数据库连接
  const dbPath = path.join(dataDir, `${dbName}.db`);
  const db = new Database(dbPath);

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 存储连接
  databases.set(dbName, db);

  console.log(`✅ Database "${dbName}" connected: ${dbPath}`);
  return db;
};

/**
 * 获取默认数据库（向后兼容）
 */
export const db = getDatabase(defaultDbName);

/**
 * 获取所有数据库文件列表
 * @returns {Array} 数据库名称列表
 */
export const getAllDatabases = () => {
  const files = fs.readdirSync(dataDir);
  return files
    .filter(file => file.endsWith('.db'))
    .map(file => file.replace('.db', ''));
};

/**
 * 创建新数据库
 * @param {string} dbName - 数据库名称
 * @returns {Database} 新创建的数据库连接
 */
export const createDatabase = (dbName) => {
  if (databases.has(dbName)) {
    return databases.get(dbName);
  }
  return getDatabase(dbName);
};

/**
 * 删除数据库（谨慎使用）
 * @param {string} dbName - 数据库名称
 */
export const deleteDatabase = (dbName) => {
  // 关闭连接
  if (databases.has(dbName)) {
    const db = databases.get(dbName);
    db.close();
    databases.delete(dbName);
  }

  // 删除文件
  const dbPath = path.join(dataDir, `${dbName}.db`);
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`🗑️ Database "${dbName}" deleted`);
  }
};

// 初始化默认数据库的表
const initDefaultTables = () => {
  const defaultDb = getDatabase(defaultDbName);
  
  // 创建用户表（如果不存在）
  defaultDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 如果表已存在但没有 password 字段，则添加该字段
  try {
    defaultDb.exec(`ALTER TABLE users ADD COLUMN password TEXT`);
  } catch (error) {
    // 字段已存在，忽略错误
    if (!error.message.includes('duplicate column name')) {
      console.warn('添加 password 字段时出现警告:', error.message);
    }
  }

  // 创建触发器自动更新 updated_at
  defaultDb.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  // 创建卡包表（如果不存在）
  defaultDb.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      name TEXT,
      merchant TEXT,
      amount REAL,
      date TEXT,
      note TEXT,
      image_url TEXT,
      owner TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(barcode, user_id)
    )
  `);

  // 如果表已存在但没有 owner 字段，则添加该字段
  try {
    defaultDb.exec(`ALTER TABLE cards ADD COLUMN owner TEXT`);
  } catch (error) {
    // 字段已存在，忽略错误
    if (!error.message.includes('duplicate column name')) {
      console.warn('添加 owner 字段时出现警告:', error.message);
    }
  }

  // 如果表已存在但没有 user_id 字段，则添加该字段
  try {
    defaultDb.exec(`ALTER TABLE cards ADD COLUMN user_id INTEGER`);
  } catch (error) {
    // 字段已存在，忽略错误
    if (!error.message.includes('duplicate column name') && !error.message.includes('duplicate column')) {
      console.warn('添加 user_id 字段时出现警告:', error.message);
    }
  }

  // 创建卡包表索引
  defaultDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_barcode ON cards(barcode);
    CREATE INDEX IF NOT EXISTS idx_merchant ON cards(merchant);
    CREATE INDEX IF NOT EXISTS idx_date ON cards(date);
    CREATE INDEX IF NOT EXISTS idx_owner ON cards(owner);
    CREATE INDEX IF NOT EXISTS idx_user_id ON cards(user_id);
  `);

  // 创建卡包表触发器
  defaultDb.exec(`
    CREATE TRIGGER IF NOT EXISTS update_cards_timestamp 
    AFTER UPDATE ON cards
    BEGIN
      UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
};

// 初始化
initDefaultTables();

