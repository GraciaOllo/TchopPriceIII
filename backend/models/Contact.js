import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    buyerPhone: {
        type: String,
        required: true
    },
    buyerEmail: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'responded', 'closed'],
        default: 'pending'
    },
    farmerResponse: {
        type: String,
        trim: true
    },
    respondedAt: {
        type: Date
    }
    }, {
    timestamps: true
    });

// Index for efficient querying
contactSchema.index({ farmer: 1, status: 1 });
contactSchema.index({ buyer: 1 });
contactSchema.index({ product: 1 });

export default mongoose.model('Contact', contactSchema);