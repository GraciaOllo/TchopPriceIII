import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Price',
    required: true
  },
  type: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure one vote per user per price
voteSchema.index({ user: 1, price: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);