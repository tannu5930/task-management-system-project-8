import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  profilePic: {
    type: String,
    default: '',
  },
  profilePicPublicId: {
    type: String,
    default: null,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;