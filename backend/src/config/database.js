// 向后兼容：导出默认数据库
// 新的多数据库功能请使用 database-manager.js
export { db, getDatabase, getAllDatabases, createDatabase, deleteDatabase } from './database-manager.js';
