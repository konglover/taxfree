/**
 * 小票管理 - localStorage 存储
 */

const STORAGE_KEY = 'tax_refund_receipts';

const getDefaultData = () => ({
  receipts: [],
  owners: [],
  lastSelectedOwner: ''
});

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultData();
    return JSON.parse(stored);
  } catch {
    return getDefaultData();
  }
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

export const addReceipt = (ticketNumber, owner) => {
  const data = loadData();
  const newReceipt = {
    id: `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    ticketNumber,
    owner: owner || '',
    isAbnormal: false,
    createdAt: Date.now()
  };
  data.receipts.push(newReceipt);
  data.lastSelectedOwner = owner || '';
  saveData(data);
};

export const updateReceipt = (id, updates) => {
  const data = loadData();
  const index = data.receipts.findIndex((r) => r.id === id);
  if (index !== -1) {
    data.receipts[index] = { ...data.receipts[index], ...updates };
    saveData(data);
  }
};

export const deleteReceipt = (id) => {
  const data = loadData();
  data.receipts = data.receipts.filter((r) => r.id !== id);
  saveData(data);
};

export const addOwner = (name) => {
  const data = loadData();
  const newOwner = {
    id: `owner_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    name,
    createdAt: Date.now()
  };
  data.owners.push(newOwner);
  saveData(data);
  return newOwner;
};

export const deleteOwner = (id) => {
  const data = loadData();
  data.owners = data.owners.filter((o) => o.id !== id);
  data.receipts.forEach((r) => {
    if (r.owner === id) r.owner = '';
  });
  saveData(data);
};

export const loadDemoData = () => {
  const data = loadData();
  const demoNames = ['张三', '李四'];
  demoNames.forEach((name) => {
    if (!data.owners.some((o) => o.name === name)) {
      const owner = addOwner(name);
      for (let i = 0; i < 2; i++) {
        addReceipt(
          `${Date.now().toString().slice(-10)}${Math.random().toString().slice(2, 6)}`,
          owner.id
        );
      }
    }
  });
  addReceipt(`${Date.now().toString().slice(-10)}${Math.random().toString().slice(2, 6)}`, '');
};
