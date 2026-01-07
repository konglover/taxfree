import { db } from '../config/database-manager.js';

// 获取所有卡包（只返回当前用户的卡包）
export const getCards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { owner, merchant, search } = req.query;
    let query = 'SELECT * FROM cards WHERE user_id = ?';
    const params = [userId];
    const conditions = [];

    if (owner && owner !== '全部') {
      conditions.push('owner = ?');
      params.push(owner);
    }
    
    if (merchant) {
      conditions.push('merchant = ?');
      params.push(merchant);
    }
    
    if (search) {
      conditions.push('(barcode LIKE ? OR name LIKE ? OR merchant LIKE ? OR owner LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const cards = stmt.all(...params);
    
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cards' });
  }
};

// 根据ID获取卡包（只返回当前用户的卡包）
export const getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const stmt = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?');
    const card = stmt.get(id, userId);
    
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch card' });
  }
};

// 创建卡包（关联当前用户）
export const createCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { barcode, name, merchant, amount, date, note, image_url, owner } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Barcode is required' });
    }
    
    if (!owner) {
      return res.status(400).json({ success: false, error: 'Owner is required' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO cards (barcode, name, merchant, amount, date, note, image_url, owner, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(barcode, name || null, merchant || null, amount || null, date || null, note || null, image_url || null, owner || null, userId);
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastInsertRowid, barcode, name, merchant, amount, date, note, image_url, owner, user_id: userId } 
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: '该一维码已存在' });
    }
    console.error('Error creating card:', error);
    res.status(500).json({ success: false, error: 'Failed to create card' });
  }
};

// 更新卡包（只能更新当前用户的卡包）
export const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { barcode, name, merchant, amount, date, note, image_url, owner } = req.body;
    
    if (!owner) {
      return res.status(400).json({ success: false, error: 'Owner is required' });
    }
    
    const stmt = db.prepare(`
      UPDATE cards 
      SET barcode = ?, name = ?, merchant = ?, amount = ?, date = ?, note = ?, image_url = ?, owner = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(barcode, name, merchant, amount, date, note, image_url, owner, id, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, message: 'Card updated successfully' });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ success: false, error: 'Failed to update card' });
  }
};

// 删除卡包（只能删除当前用户的卡包）
export const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const stmt = db.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
};

// 获取当前用户的所有绑定人列表
export const getOwners = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 首先检查表结构，确保字段存在
    try {
      // 尝试查询表结构
      const tableInfo = db.prepare("PRAGMA table_info(cards)").all();
      const hasUserId = tableInfo.some(col => col.name === 'user_id');
      const hasOwner = tableInfo.some(col => col.name === 'owner');
      
      if (!hasUserId || !hasOwner) {
        console.warn('Cards table missing required columns. user_id:', hasUserId, 'owner:', hasOwner);
        return res.json({ 
          success: true, 
          data: [] 
        });
      }
    } catch (checkError) {
      console.error('Error checking table structure:', checkError);
      return res.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // 查询当前用户的所有卡包，提取不重复的绑定人
    // 使用 TRIM 和 LENGTH 来过滤空字符串，兼容 SQLite
    const stmt = db.prepare(`
      SELECT DISTINCT owner 
      FROM cards 
      WHERE user_id = ? 
        AND owner IS NOT NULL 
        AND TRIM(owner) != '' 
        AND LENGTH(TRIM(owner)) > 0
      ORDER BY owner
    `);
    const owners = stmt.all(userId);
    
    const ownerList = owners.map(row => row.owner).filter(Boolean);
    
    res.json({ 
      success: true, 
      data: ownerList 
    });
  } catch (error) {
    console.error('Error fetching owners:', error);
    // 如果查询失败，可能是表结构问题，返回空数组
    res.json({ 
      success: true, 
      data: [] 
    });
  }
};

















