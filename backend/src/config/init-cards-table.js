import { db } from './database-manager.js';

// 初始化卡包表
export const initCardsTable = () => {
  try {
    db.exec(`
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
      db.exec(`ALTER TABLE cards ADD COLUMN owner TEXT`);
    } catch (error) {
      // 字段已存在，忽略错误
      if (!error.message.includes('duplicate column name')) {
        console.warn('添加 owner 字段时出现警告:', error.message);
      }
    }

    // 如果表已存在但没有 user_id 字段，则添加该字段
    try {
      db.exec(`ALTER TABLE cards ADD COLUMN user_id INTEGER`);
    } catch (error) {
      // 字段已存在，忽略错误
      if (!error.message.includes('duplicate column name')) {
        console.warn('添加 user_id 字段时出现警告:', error.message);
      }
    }

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_barcode ON cards(barcode);
      CREATE INDEX IF NOT EXISTS idx_merchant ON cards(merchant);
      CREATE INDEX IF NOT EXISTS idx_date ON cards(date);
      CREATE INDEX IF NOT EXISTS idx_owner ON cards(owner);
      CREATE INDEX IF NOT EXISTS idx_user_id ON cards(user_id);
    `);

    // 创建触发器
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_cards_timestamp 
      AFTER UPDATE ON cards
      BEGIN
        UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    console.log('✅ Cards table initialized');
  } catch (error) {
    console.error('❌ Error initializing cards table:', error);
  }
};

















