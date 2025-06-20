import Product from '../models/Product.js';
import Price from '../models/Price.js';
import Comment from '../models/Comment.js';
import Contact from '../models/Contact.js';
import { validationResult } from 'express-validator';
import { createNotification, notifyAdmins } from './notificationController.js';

export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, category, description, price, unit, quantity, quality,
      contactPhone, contactEmail, region, city, address, image 
    } = req.body;

    // Only farmers and admins can create products
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only farmers and admins can create products' });
    }

    const product = new Product({
      name,
      category,
      description,
      price,
      unit,
      quantity,
      quality: quality || 'standard',
      farmer: req.user.id,
      contactPhone,
      contactEmail,
      location: {
        region,
        city,
        address
      },
      image: image || ''
    });

    await product.save();
    await product.populate('farmer', 'name email role region');

    // Notify admins about new product
    try {
      await notifyAdmins(
        'product_created',
        'New Product Posted',
        `${req.user.name} posted a new product: ${name}`,
        {
          productId: product._id,
          productName: name,
          farmerName: req.user.name,
          price: price
        },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      region, 
      search, 
      status = 'approved',
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      farmer
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (region) query['location.region'] = new RegExp(region, 'i');
    if (status) query.status = status;
    if (farmer) query.farmer = farmer;

    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('farmer', 'name email role region location')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { farmer: req.user.id, isActive: true };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('My products fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      name, description, price, quantity, quality,
      contactPhone, contactEmail, region, city, address 
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Only the farmer who created the product can update it
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (quantity) product.quantity = quantity;
    if (quality) product.quality = quality;
    if (contactPhone) product.contactPhone = contactPhone;
    if (contactEmail) product.contactEmail = contactEmail;
    
    if (region || city || address) {
      if (region) product.location.region = region;
      if (city) product.location.city = city;
      if (address) product.location.address = address;
    }

    // Reset status to pending if product was previously rejected
    if (product.status === 'rejected') {
      product.status = 'pending';
      product.rejectedBy = undefined;
      product.rejectedAt = undefined;
      product.rejectionReason = undefined;
    }

    await product.save();
    await product.populate('farmer', 'name email role region');

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Only the farmer who created the product or admin can delete it
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};

export const approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = 'approved';
    product.approvedBy = req.user.id;
    product.approvedAt = new Date();
    await product.save();

    // Create a price entry when product is approved
    try {
      const newPrice = new Price({
        product: productId,
        region: product.location.region,
        market: product.location.city,
        price: product.price,
        unit: product.unit,
        quality: product.quality,
        reportedBy: product.farmer,
        isVerified: true, // Auto-verify since it's from approved product
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        notes: `Auto-created from approved product: ${product.name}`
      });

      await newPrice.save();
    } catch (priceError) {
      console.error('Error creating price from approved product:', priceError);
    }

    // Notify farmer
    try {
      await createNotification(
        product.farmer,
        'product_approved',
        'Product Approved',
        `Your product "${product.name}" has been approved and is now visible to buyers. A market price has been automatically created.`,
        { productId: product._id },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({ message: 'Product approved successfully and price created' });
  } catch (error) {
    console.error('Product approval error:', error);
    res.status(500).json({ message: 'Server error while approving product' });
  }
};

export const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = 'rejected';
    product.rejectedBy = req.user.id;
    product.rejectedAt = new Date();
    product.rejectionReason = reason;
    await product.save();

    // Notify farmer
    try {
      await createNotification(
        product.farmer,
        'product_rejected',
        'Product Rejected',
        `Your product "${product.name}" has been rejected. Reason: ${reason}`,
        { productId: product._id, reason },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({ message: 'Product rejected successfully' });
  } catch (error) {
    console.error('Product rejection error:', error);
    res.status(500).json({ message: 'Server error while rejecting product' });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldStatus = product.status;
    product.status = status;
    
    if (status === 'approved') {
      product.approvedBy = req.user.id;
      product.approvedAt = new Date();
      product.rejectedBy = undefined;
      product.rejectedAt = undefined;
      product.rejectionReason = undefined;

      // Create price entry if not previously approved
      if (oldStatus !== 'approved') {
        try {
          const newPrice = new Price({
            product: productId,
            region: product.location.region,
            market: product.location.city,
            price: product.price,
            unit: product.unit,
            quality: product.quality,
            reportedBy: product.farmer,
            isVerified: true,
            verifiedBy: req.user.id,
            verifiedAt: new Date(),
            notes: `Auto-created from approved product: ${product.name}`
          });

          await newPrice.save();
        } catch (priceError) {
          console.error('Error creating price from approved product:', priceError);
        }
      }
    } else if (status === 'rejected') {
      product.rejectedBy = req.user.id;
      product.rejectedAt = new Date();
      product.rejectionReason = reason;
      product.approvedBy = undefined;
      product.approvedAt = undefined;
    } else if (status === 'pending') {
      product.approvedBy = undefined;
      product.approvedAt = undefined;
      product.rejectedBy = undefined;
      product.rejectedAt = undefined;
      product.rejectionReason = undefined;
    }

    await product.save();

    // Notify farmer
    try {
      const notificationType = status === 'approved' ? 'product_approved' : 
                              status === 'rejected' ? 'product_rejected' : 'product_pending';
      const title = status === 'approved' ? 'Product Approved' : 
                   status === 'rejected' ? 'Product Rejected' : 'Product Under Review';
      const message = status === 'approved' ? 
                     `Your product "${product.name}" has been approved and is now visible to buyers. A market price has been automatically created.` :
                     status === 'rejected' ? 
                     `Your product "${product.name}" has been rejected. Reason: ${reason}` :
                     `Your product "${product.name}" is under review.`;

      await createNotification(
        product.farmer,
        notificationType,
        title,
        message,
        { productId: product._id, reason },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({ message: `Product ${status} successfully` });
  } catch (error) {
    console.error('Product status update error:', error);
    res.status(500).json({ message: 'Server error while updating product status' });
  }
};

export const voteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type } = req.body; // 'upvote' or 'downvote'

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is pending (only pending products can be voted on)
    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Can only vote on pending products' });
    }

    // Only farmers and admins can vote, and not on their own products
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only farmers and admins can vote' });
    }

    if (product.farmer.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot vote on your own product' });
    }

    const userId = req.user.id;

    // Remove any existing vote by this user
    product.votes.upvotes = product.votes.upvotes.filter(vote => vote.user.toString() !== userId);
    product.votes.downvotes = product.votes.downvotes.filter(vote => vote.user.toString() !== userId);

    // Add new vote
    if (type === 'upvote') {
      product.votes.upvotes.push({ user: userId, timestamp: new Date() });
    } else if (type === 'downvote') {
      product.votes.downvotes.push({ user: userId, timestamp: new Date() });
    }

    await product.save();

    res.json({
      message: 'Vote recorded successfully',
      votes: {
        upvotes: product.votes.upvotes.length,
        downvotes: product.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error while voting' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { productId } = req.params;
    const { content, parentComment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const comment = new Comment({
      product: productId,
      user: req.user.id,
      content,
      parentComment: parentComment || undefined
    });

    await comment.save();
    await comment.populate('user', 'name role');

    // Notify product owner if commenter is not the owner
    if (product.farmer.toString() !== req.user.id) {
      try {
        await createNotification(
          product.farmer,
          'product_comment',
          'New Comment on Your Product',
          `${req.user.name} commented on your product "${product.name}": ${content.substring(0, 100)}...`,
          { 
            productId: product._id, 
            commentId: comment._id,
            commenterName: req.user.name 
          },
          req.user.id
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      product: productId, 
      parentComment: { $exists: false } 
    })
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get replies for each comment
    for (let comment of comments) {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('user', 'name role')
        .sort({ createdAt: 1 });
      comment.replies = replies;
    }

    const total = await Comment.countDocuments({ 
      product: productId, 
      parentComment: { $exists: false } 
    });

    res.json({
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
};

export const contactFarmer = async (req, res) => {
  try {
    const { productId } = req.params;
    const { message, buyerPhone, buyerEmail } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Only buyers and admins can contact farmers
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only buyers and admins can contact farmers' });
    }

    const contact = new Contact({
      buyer: req.user.id,
      farmer: product.farmer,
      product: productId,
      message,
      buyerPhone,
      buyerEmail
    });

    await contact.save();
    await contact.populate([
      { path: 'buyer', select: 'name email role' },
      { path: 'product', select: 'name price' }
    ]);

    // Notify farmer
    try {
      await createNotification(
        product.farmer,
        'buyer_contact',
        'New Buyer Inquiry',
        `${req.user.name} is interested in your product "${product.name}". Check your contacts for details.`,
        { 
          productId: product._id, 
          contactId: contact._id,
          buyerName: req.user.name 
        },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      message: 'Contact request sent successfully',
      contact
    });
  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(500).json({ message: 'Server error while sending contact request' });
  }
};

export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { farmer: req.user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .populate('buyer', 'name email role')
      .populate('product', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Contacts fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching contacts' });
  }
};

export const respondToContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { response } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Only the farmer can respond
    if (contact.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this contact' });
    }

    contact.farmerResponse = response;
    contact.status = 'responded';
    contact.respondedAt = new Date();
    await contact.save();

    // Notify buyer
    try {
      await createNotification(
        contact.buyer,
        'farmer_response',
        'Farmer Responded',
        `The farmer has responded to your inquiry. Check your messages for details.`,
        { 
          contactId: contact._id,
          farmerName: req.user.name 
        },
        req.user.id
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({
      message: 'Response sent successfully',
      contact
    });
  } catch (error) {
    console.error('Contact response error:', error);
    res.status(500).json({ message: 'Server error while responding to contact' });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const approvedProducts = await Product.countDocuments({ status: 'approved', isActive: true });
    const pendingProducts = await Product.countDocuments({ status: 'pending', isActive: true });
    const rejectedProducts = await Product.countDocuments({ status: 'rejected', isActive: true });

    res.json({
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      approvalRate: totalProducts > 0 ? ((approvedProducts / totalProducts) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Product stats error:', error);
    res.status(500).json({ message: 'Server error while fetching product stats' });
  }
};

export const getRecentProducts = async (req, res) => {
  try {
    const { limit = 7 } = req.query;
    
    const products = await Product.find({ 
      status: 'approved', 
      isActive: true 
    })
      .populate('farmer', 'name email role region location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      products
    });
  } catch (error) {
    console.error('Recent products fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching recent products' });
  }
};