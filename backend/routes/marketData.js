import express from 'express';
import { 
  getCashCropPrices, 
  getCashCropTrends, 
  getMarketSummary 
} from '../controllers/marketDataController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All market data routes require authentication
router.get('/cash-crops', authenticateToken, getCashCropPrices);
router.get('/trends/:crop', authenticateToken, getCashCropTrends);
router.get('/summary', authenticateToken, getMarketSummary);

export default router;