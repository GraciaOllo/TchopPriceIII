import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
    }, {
    timestamps: true
    });

    // Index for efficient querying
    commentSchema.index({ product: 1, createdAt: -1 });
    commentSchema.index({ user: 1 });
    commentSchema.index({ parentComment: 1 });

    export default mongoose.model('Comment', commentSchema);