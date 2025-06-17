import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['cereals', 'legumes', 'tubers', 'fruits', 'vegetables', 'spices', 'cash_crops']
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'ton', 'bag', 'bunch', 'piece', 'liter']
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema);