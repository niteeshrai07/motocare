const User = require('../models/user.model');
const RepairShop = require('../models/repairShop.model');
const { buildProfileResponse } = require('../mappers/profile.mapper');

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        errors: null,
      });
    }

    let shop = null;

    if (user.role === 'mechanic') {
      shop = await RepairShop.findOne({ ownerId: user._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: { profile: buildProfileResponse(user, shop) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the profile',
      data: null,
      errors: null,
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        errors: null,
      });
    }

    const { name, phone } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    let shop = null;
    if (user.role === 'mechanic') {
      shop = await RepairShop.findOne({ ownerId: user._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile: buildProfileResponse(user, shop) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating the profile',
      data: null,
      errors: null,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        errors: null,
      });
    }

    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        data: null,
        errors: null,
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null,
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while changing the password',
      data: null,
      errors: null,
    });
  }
};

const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        errors: null,
      });
    }

    if (!user.isActive) {
      return res.status(409).json({
        success: false,
        message: 'Account is already deactivated',
        data: null,
        errors: null,
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
      data: null,
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while deactivating the account',
      data: null,
      errors: null,
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  deactivateAccount,
};
