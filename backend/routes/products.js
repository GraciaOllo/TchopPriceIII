import express from 'express';
import { body } from 'express-validator';
import { 
  createProduct,
  getProducts,
  getMyProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
  rejectProduct,
  updateProductStatus,
  voteProduct,
  addComment,
  getComments,
  contactFarmer,
  getContacts,
  respondToContact,
  getProductStats,
  getRecentProducts
} from '../controllers/productController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const productValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('category').isIn(['cereals', 'legumes', 'tubers', 'fruits', 'vegetables', 'spices', 'cash_crops']).withMessage('Invalid category'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Valid price required'),
  body('unit').isIn(['kg', 'ton', 'bag', 'bunch', 'piece', 'liter']).withMessage('Invalid unit'),
  body('quantity').isNumeric().isFloat({ min: 0 }).withMessage('Valid quantity required'),
  body('contactPhone').trim().isLength({ min: 8 }).withMessage('Valid phone number required'),
  body('contactEmail').isEmail().withMessage('Valid email required'),
  body('region').trim().notEmpty().withMessage('Region is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
];

const commentValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
];

const contactValidation = [
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('buyerPhone').trim().isLength({ min: 8 }).withMessage('Valid phone number required'),
  body('buyerEmail').isEmail().withMessage('Valid email required')
];

// Public routes
router.get('/', getProducts);
router.get('/recent', getRecentProducts);
router.get('/:productId/comments', getComments);

// Protected routes (authentication required)
router.post('/', authenticateToken, authorizeRoles('farmer','admin'), productValidation, createProduct);
router.get('/my-products', authenticateToken, authorizeRoles('farmer'), getMyProducts);
router.put('/:productId', authenticateToken, authorizeRoles('farmer'), updateProduct);
router.delete('/:productId', authenticateToken, deleteProduct);
router.post('/:productId/vote', authenticateToken, voteProduct);
router.post('/:productId/comments', authenticateToken, commentValidation, addComment);
router.post('/:productId/contact', authenticateToken, authorizeRoles('buyer'), contactValidation, contactFarmer);

// Farmer routes
router.get('/contacts', authenticateToken, authorizeRoles('farmer'), getContacts);
router.post('/contacts/:contactId/respond', authenticateToken, authorizeRoles('farmer'), respondToContact);

// Admin routes
router.patch('/:productId/approve', authenticateToken, authorizeRoles('admin'), approveProduct);
router.patch('/:productId/reject', authenticateToken, authorizeRoles('admin'), rejectProduct);
router.patch('/:productId/status', authenticateToken, authorizeRoles('admin'), updateProductStatus);
router.get('/stats', authenticateToken, authorizeRoles('admin'), getProductStats);

export default router;