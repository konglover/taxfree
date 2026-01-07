import { Router } from 'express';
import { 
  getCards, 
  getCardById, 
  createCard, 
  updateCard, 
  deleteCard,
  getOwners
} from '../controllers/cards.controller.js';
import { authenticateToken } from '../controllers/auth.controller.js';

const router = Router();

// 所有卡包路由都需要认证
router.get('/owners', authenticateToken, getOwners);
router.get('/', authenticateToken, getCards);
router.get('/:id', authenticateToken, getCardById);
router.post('/', authenticateToken, createCard);
router.put('/:id', authenticateToken, updateCard);
router.delete('/:id', authenticateToken, deleteCard);

export default router;

















