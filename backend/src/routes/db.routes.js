import { Router } from 'express';
import { getTables, getTableStructure, getTableData } from '../controllers/db.controller.js';

const router = Router();

router.get('/tables', getTables);
router.get('/tables/:tableName/structure', getTableStructure);
router.get('/tables/:tableName/data', getTableData);

export default router;

















