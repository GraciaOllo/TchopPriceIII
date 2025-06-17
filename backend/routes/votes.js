import express from 'express';
import Vote from '../models/Vote.js';
import Price from '../models/Price.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's votes
router.get('/my-votes', authenticateToken, async (req, res) => {
  try {
    const votes = await Vote.find({ user: req.user.id })
      .populate({
        path: 'price',
        populate: {
          path: 'product',
          select: 'name category'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ votes });
  } catch (error) {
    console.error('Votes fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching votes' });
  }
});

export default router;