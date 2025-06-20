import User from '../models/User.js';
import { validationResult } from 'express-validator';

export const getAllUsers = async (req, res) => {
  try {
    const { role, region, page = 1, limit = 10, search, status } = req.query;
    const query = { isDeleted: { $ne: true } };
    
    if (role) query.role = role;
    if (region) query.region = new RegExp(region, 'i');
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (status === 'blocked') query.isBlocked = true;

    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, region, location, role, crops } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      region,
      location,
      role: role || 'farmer',
      crops: crops || [],
      isVerified: true, // Admin-created users are auto-verified
      createdBy: req.user.id
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, region, location, role, crops, isVerified, isBlocked } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (region) user.region = region;
    if (location) user.location = location;
    if (role) user.role = role;
    if (crops) user.crops = crops;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (typeof isBlocked === 'boolean') user.isBlocked = isBlocked;

    user.updatedBy = req.user.id;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        region: user.region,
        location: user.location,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - mark as deleted instead of removing
    user.isDeleted = true;
    user.deletedBy = req.user.id;
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = true;
    user.verifiedBy = req.user.id;
    user.verifiedAt = new Date();
    await user.save();

    res.json({ message: 'User verified successfully' });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ message: 'Server error while verifying user' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = true;
    user.blockReason = reason;
    user.blockedBy = req.user.id;
    user.blockedAt = new Date();
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('User blocking error:', error);
    res.status(500).json({ message: 'Server error while blocking user' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = false;
    user.blockReason = undefined;
    user.unblockedBy = req.user.id;
    user.unblockedAt = new Date();
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('User unblocking error:', error);
    res.status(500).json({ message: 'Server error while unblocking user' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const verifiedUsers = await User.countDocuments({ isVerified: true, isDeleted: { $ne: true } });
    const blockedUsers = await User.countDocuments({ isBlocked: true, isDeleted: { $ne: true } });
    const farmerCount = await User.countDocuments({ role: 'farmer', isDeleted: { $ne: true } });
    const buyerCount = await User.countDocuments({ role: 'buyer', isDeleted: { $ne: true } });

    res.json({
      totalUsers,
      verifiedUsers,
      blockedUsers,
      farmerCount,
      buyerCount,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user stats' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, region, location, crops } = req.body;
    
    const user = await User.findById(req.user.id);
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
};