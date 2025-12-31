import mongoose from 'mongoose';

const boardInvitationSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
  },
  message: {
    type: String,
    default: '',
    trim: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

boardInvitationSchema.index({ invitedUser: 1, status: 1 });
boardInvitationSchema.index({ board: 1 });
boardInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BoardInvitation = mongoose.model('BoardInvitation', boardInvitationSchema);
export default BoardInvitation;