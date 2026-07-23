const User = require('../models/user.model');
const generateToken = require('../utils/token.util');
const buildUserResponse = require('../mappers/user.mapper');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        data: null,
        errors: null,
      });
    }

    const user = await User.create({ name, email, password, phone, role });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: buildUserResponse(user),
        token,
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong during registration',
      data: null,
      errors: null,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
        errors: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
        errors: null,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: buildUserResponse(user),
        token,
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong during login',
      data: null,
      errors: null,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: {
        user: buildUserResponse(req.user),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching current user',
      data: null,
      errors: null,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};