import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import generateToken from "../library/token.js"
import os from "node:os";
import { uploadOnCloudinary, deleteFromCloudinary } from "../library/cloudinary.js";


export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required!' });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters!' });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: 'This email is already used!' });
    }

    const hashedPassword = await bcrypt.hash(password, 9);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    await generateToken(newUser._id, res);

    return res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      message: 'Signup successful!',
    });
  } catch (error) {
    console.log('Signup error:', error.message);
    return res.status(500).json({ message: 'Error during signup!' });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = req.cookies?.JwtToken;
    if (token) {
      return res.status(406).json({ message: 'User already logged in!' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required!' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email, please signup!' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid password!' });
    }

    await generateToken(user._id, res);
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      message: 'Login successful!',
    });
  } catch (error) {
    console.log('Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};


export const getUser = async (req, res) => {
  try {
  const userId = req.userId;

  const user = await User.findById(userId).select('-password');
  if (!user) {
      return res.status(404).json({ message: 'User nahi mila!' });
  }

  return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profilePic: user.profilePic,
      profilePicPublicId: user.profilePicPublicId,
      uploadedAt: user.uploadedAt,
  });
  } catch (error) {
  console.log('Get user error:', error.message);
  res.status(500).json({ message: `User fetch mein problem: ${error.message}` });
  }
};
    

export const logout = async (req, res) => {
    try {
      const token = req.cookies?.JwtToken;

      if (!token) {
        return res.status(400).json({ message: "No user logged in!" });
      }

      res.clearCookie("JwtToken", {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      return res.status(200).json({ message: "Logout successful!" });
    } catch (error) {
      console.error("Logout error:", error.message);
      return res.status(500).json({ message: "Internal server error!" });
    }
  };


export const profilePicUpload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file provided!' });

    const result = await uploadOnCloudinary(file.path);
    if (!result.success || !result.url) return res.status(500).json({ message: 'Cloudinary upload failed!' });

    const { url, public_id } = result;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    if (user.profilePicPublicId) {
      await deleteFromCloudinary(user.profilePicPublicId);
    }

    user.profilePic = url;
    user.profilePicPublicId = public_id;
    await user.save();

    return res.status(200).json({
      message: 'Profile picture updated!',
      url,
      publicId: public_id,
    });
  } catch (error) {
    console.log('Upload error:', error.message);
    res.status(500).json({ message: 'Upload failed!' });
  }
};


export const deleteProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });
    if (!user.profilePicPublicId) return res.status(400).json({ message: 'No profile picture to delete!' });

    await deleteFromCloudinary(user.profilePicPublicId);
    user.profilePic = '';
    user.profilePicPublicId = null;
    await user.save();

    return res.status(200).json({ message: 'Profile picture deleted!' });
  } catch (error) {
    console.log('Delete error:', error.message);
    res.status(500).json({ message: 'Delete failed!' });
  }
};


export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    if (user.profilePicPublicId) {
      await deleteFromCloudinary(user.profilePicPublicId);
    }

    await User.findByIdAndDelete(req.userId);
    res.clearCookie('JwtToken', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.status(200).json({ message: 'Account deleted!' });
  } catch (error) {
    console.log('Delete account error:', error.message);
    res.status(500).json({ message: 'Account deletion failed!' });
  }
}


export const systeminfo = (req, res) => {
    const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedRAM = (totalRAM - freeRAM).toFixed(2);

    res.json({
        totalRAM: `${totalRAM} GB`,
        freeRAM: `${freeRAM} GB`,
        usedRAM: `${usedRAM} GB`,
    });
}