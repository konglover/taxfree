-- 卡包表结构
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
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_barcode ON cards(barcode);
CREATE INDEX IF NOT EXISTS idx_merchant ON cards(merchant);
CREATE INDEX IF NOT EXISTS idx_date ON cards(date);
CREATE INDEX IF NOT EXISTS idx_owner ON cards(owner);
CREATE INDEX IF NOT EXISTS idx_user_id ON cards(user_id);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_cards_timestamp 
AFTER UPDATE ON cards
BEGIN
  UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

















