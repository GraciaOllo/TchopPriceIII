import express from 'express';
import { body } from 'express-validator';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  verifyUser, 
  blockUser, 
  unblockUser, 
  getUserStats,
  updateProfile 
} from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().isLength({ min: 8 }).withMessage('Valid phone number required'),
  body('region').trim().notEmpty().withMessage('Region is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

// Admin routes
router.get('/', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.post('/', authenticateToken, authorizeRoles('admin'), createUserValidation, createUser);
router.put('/:userId', authenticateToken, authorizeRoles('admin'), updateUser);
router.delete('/:userId', authenticateToken, authorizeRoles('admin'), deleteUser);
router.patch('/:userId/verify', authenticateToken, authorizeRoles('admin'), verifyUser);
router.patch('/:userId/block', authenticateToken, authorizeRoles('admin'), blockUser);
router.patch('/:userId/unblock', authenticateToken, authorizeRoles('admin'), unblockUser);
router.get('/stats', authenticateToken, authorizeRoles('admin'), getUserStats);

// User profile routes
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, region, location, crops } = req.body;
    
    const user = await user.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (region) user.region = region;
    if (location) user.location = location;
    if (crops) user.crops = crops;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        region: user.region,
        location: user.location,
        crops: user.crops
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

export default router;