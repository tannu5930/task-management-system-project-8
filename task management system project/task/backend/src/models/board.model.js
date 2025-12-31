import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowTaskAssignment: {
      type: Boolean,
      default: true,
    },
  },
}, { timestamps: true });

boardSchema.index({ owner: 1 });
boardSchema.index({ 'members.user': 1 });

const Board = mongoose.model('Board', boardSchema);
export default Board;