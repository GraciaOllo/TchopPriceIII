import Price from '../models/Price.js';
import Product from '../models/Product.js';
import { validationResult } from 'express-validator';
import { notifyAdmins } from './notificationController.js';

export const createPrice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, region, market, price, unit, quality, coordinates, notes } = req.body;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newPrice = new Price({
      product: productId,
      region,
      market,
      price,
      unit,
      quality: quality || 'standard',
      reportedBy: req.user.id,
      coordinates,
      notes
    });

    await newPrice.save();
    await newPrice.populate('product reportedBy', 'name email role');

    // Notify admins about new price signal
    try {
      await notifyAdmins(
        'price_signal',
        'New Price Signal',
        `${req.user.name} reported a new price for ${product.name} in ${market}, ${region}`,
        {
          priceId: newPrice._id,
          productName: product.name,
          price: price,
          market: market,
          region: region
        },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      message: 'Price reported successfully',
      price: newPrice
    });
  } catch (error) {
    console.error('Price creation error:', error);
    res.status(500).json({ message: 'Server error while creating price' });
  }
};

export const getPrices = async (req, res) => {
  try {
    const { 
      product, 
      region, 
      market, 
      quality, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      verified
    } = req.query;

    const query = {};
    
    if (product) query.product = product;
    if (region) query.region = new RegExp(region, 'i');
    if (market) query.market = new RegExp(market, 'i');
    if (quality) query.quality = quality;
    if (verified !== undefined) query.isVerified = verified === 'true';

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const prices = await Price.find(query)
      .populate('product', 'name category unit image')
      .populate('reportedBy', 'name role region')
      .populate('verifiedBy', 'name role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Price.countDocuments(query);

    res.json({
      prices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching prices' });
  }
};

export const verifyPrice = async (req, res) => {
  try {
    const { priceId } = req.params;
    
    const price = await Price.findById(priceId);
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }

    price.isVerified = true;
    price.verifiedBy = req.user.id;
    price.verifiedAt = new Date();
    await price.save();

    res.json({ message: 'Price verified successfully' });
  } catch (error) {
    console.error('Price verification error:', error);
    res.status(500).json({ message: 'Server error while verifying price' });
  }
};

export const deletePrice = async (req, res) => {
  try {
    const { priceId } = req.params;
    
    const price = await Price.findById(priceId);
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }

    await Price.findByIdAndDelete(priceId);
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    console.error('Price deletion error:', error);
    res.status(500).json({ message: 'Server error while deleting price' });
  }
};

export const getLatestPrices = async (req, res) => {
  try {
    const { region, limit = 10 } = req.query;
    
    const matchStage = {};
    if (region) matchStage.region = new RegExp(region, 'i');

    const prices = await Price.aggregate([
      { $match: matchStage },
      { $sort: { product: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$product',
          latestPrice: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestPrice' } },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit) }
    ]);

    await Price.populate(prices, [
      { path: 'product', select: 'name category unit image' },
      { path: 'reportedBy', select: 'name role region' }
    ]);

    res.json({ prices });
  } catch (error) {
    console.error('Latest prices fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching latest prices' });
  }
};

export const getPriceHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { region, days = 30 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const query = {
      product: productId,
      createdAt: { $gte: dateFrom }
    };

    if (region) query.region = new RegExp(region, 'i');

    const prices = await Price.find(query)
      .select('price region market quality createdAt')
      .sort({ createdAt: 1 });

    res.json({ prices });
  } catch (error) {
    console.error('Price history fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching price history' });
  }
};

export const votePrice = async (req, res) => {
  try {
    const { priceId } = req.params;
    const { type } = req.body; // 'upvote' or 'downvote'

    const price = await Price.findById(priceId);
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }

    const userId = req.user.id;

    // Remove any existing vote by this user
    price.votes.upvotes = price.votes.upvotes.filter(vote => vote.user.toString() !== userId);
    price.votes.downvotes = price.votes.downvotes.filter(vote => vote.user.toString() !== userId);

    // Add new vote
    if (type === 'upvote') {
      price.votes.upvotes.push({ user: userId, timestamp: new Date() });
    } else if (type === 'downvote') {
      price.votes.downvotes.push({ user: userId, timestamp: new Date() });
    }

    await price.save();

    res.json({
      message: 'Vote recorded successfully',
      votes: {
        upvotes: price.votes.upvotes.length,
        downvotes: price.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error while voting' });
  }
};

export const getPriceStats = async (req, res) => {
  try {
    const totalPrices = await Price.countDocuments();
    const verifiedPrices = await Price.countDocuments({ isVerified: true });
    const todayPrices = await Price.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    res.json({
      totalPrices,
      verifiedPrices,
      todayPrices,
      verificationRate: totalPrices > 0 ? ((verifiedPrices / totalPrices) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Price stats error:', error);
    res.status(500).json({ message: 'Server error while fetching price stats' });
  }
};