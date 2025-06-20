import express from 'express';
import { body } from 'express-validator';
import { 
  createPrice, 
  getPrices, 
  getLatestPrices, 
  getPriceHistory, 
  votePrice,
  verifyPrice,
  deletePrice,
  updatePrice,
  getPriceStats
} from '../controllers/priceController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const priceValidation = [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('region').trim().notEmpty().withMessage('Region is required'),
  body('market').trim().notEmpty().withMessage('Market is required'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Valid price required'),
  body('unit').trim().notEmpty().withMessage('Unit is required')
];

const priceUpdateValidation = [
  body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Valid price required'),
  body('quality').optional().isIn(['premium', 'standard', 'low']).withMessage('Invalid quality'),
  body('region').optional().trim().notEmpty().withMessage('Region cannot be empty'),
  body('market').optional().trim().notEmpty().withMessage('Market cannot be empty')
];

// Routes
router.post('/', authenticateToken, priceValidation, createPrice);

// Public routes (no authentication required for viewing)
router.get('/', getPrices);
router.get('/latest', getLatestPrices);
router.get('/history/:productId', getPriceHistory);

// Protected routes (authentication required)
router.post('/:priceId/vote', authenticateToken, votePrice);

// Admin routes
router.patch('/:priceId/verify', authenticateToken, authorizeRoles('admin'), verifyPrice);
router.put('/:priceId', authenticateToken, authorizeRoles('admin'), priceUpdateValidation, updatePrice);
router.delete('/:priceId', authenticateToken, authorizeRoles('admin'), deletePrice);
router.get('/stats', authenticateToken, authorizeRoles('admin'), getPriceStats);

export default router;