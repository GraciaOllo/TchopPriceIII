import express from 'express';
import Product from '../models/Product.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all products (public route - no authentication required)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name role')
      .sort({ name: 1 });

    res.json({ products });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// Create product (admin/agent only)
router.post('/', authenticateToken, authorizeRoles('admin', 'farmer'), async (req, res) => {
  try {
    const { name, category, description, unit, image } = req.body;

    const product = new Product({
      name,
      category,
      description,
      unit,
      image: image || '',
      createdBy: req.user.id
    });

    await product.save();
    await product.populate('createdBy', 'name role');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

export default router;