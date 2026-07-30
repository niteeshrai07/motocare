const User = require('../models/user.model');
const RepairShop = require('../models/repairShop.model');
const ServiceRequest = require('../models/serviceRequest.model');
const Review = require('../models/review.model');
const { performShopStatusUpdate } = require('../controllers/repairShop.controller');
const {
  buildAdminUserListItem,
  buildAdminUserDetail,
  buildAdminRepairShopListItem,
  buildAdminRepairShopDetail,
  buildAdminServiceRequestListItem,
  buildAdminReviewListItem,
} = require('../mappers/admin.mapper');
const { buildServiceRequestResponseWithContact } = require('../mappers/serviceRequest.mapper');
const { buildReviewResponse } = require('../mappers/review.mapper');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT = 'newest';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

const REVIEW_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildUserSearchFilter = (search) => {
  if (!search) return {};

  const escaped = escapeRegExp(search);
  return {
    $or: [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } },
    ],
  };
};

const buildShopSearchFilter = (search) => {
  if (!search) return {};

  const escaped = escapeRegExp(search);
  return {
    $or: [
      { shopName: { $regex: escaped, $options: 'i' } },
      { address: { $regex: escaped, $options: 'i' } },
    ],
  };
};

const buildServiceRequestSearchFilter = (search) => {
  if (!search) return {};

  const escaped = escapeRegExp(search);
  return {
    issueDescription: { $regex: escaped, $options: 'i' },
  };
};

const buildReviewSearchFilter = (search) => {
  if (!search) return {};

  const escaped = escapeRegExp(search);
  return {
    comment: { $regex: escaped, $options: 'i' },
  };
};

const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalMechanics,
      totalAdmins,
      totalRepairShops,
      pendingShops,
      verifiedShops,
      rejectedShops,
      totalServiceRequests,
      pendingRequests,
      quotedRequests,
      acceptedRequests,
      inProgressRequests,
      completedRequests,
      rejectedRequests,
      cancelledRequests,
      expiredRequests,
      totalReviews,
      avgRatingResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'mechanic' }),
      User.countDocuments({ role: 'admin' }),
      RepairShop.countDocuments(),
      RepairShop.countDocuments({ status: 'pending' }),
      RepairShop.countDocuments({ status: 'verified' }),
      RepairShop.countDocuments({ status: 'rejected' }),
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'quoted' }),
      ServiceRequest.countDocuments({ status: 'accepted' }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.countDocuments({ status: 'rejected' }),
      ServiceRequest.countDocuments({ status: 'cancelled' }),
      ServiceRequest.countDocuments({ status: 'expired' }),
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
    ]);

    const averagePlatformRating = avgRatingResult[0]?.avgRating
      ? Math.round(avgRatingResult[0].avgRating * 100) / 100
      : 0;

    return res.status(200).json({
      success: true,
      message: 'Dashboard overview fetched successfully',
      data: {
        overview: {
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalAdmins,
          totalRepairShops,
          pendingShops,
          verifiedShops,
          rejectedShops,
          totalServiceRequests,
          pendingRequests,
          quotedRequests,
          acceptedRequests,
          inProgressRequests,
          completedRequests,
          rejectedRequests,
          cancelledRequests,
          expiredRequests,
          totalReviews,
          averagePlatformRating,
        },
        statistics: {
          usersByRole: { customer: totalCustomers, mechanic: totalMechanics, admin: totalAdmins },
          shopsByStatus: { pending: pendingShops, verified: verifiedShops, rejected: rejectedShops },
          requestsByStatus: {
            pending: pendingRequests,
            quoted: quotedRequests,
            accepted: acceptedRequests,
            in_progress: inProgressRequests,
            completed: completedRequests,
            rejected: rejectedRequests,
            cancelled: cancelledRequests,
            expired: expiredRequests,
          },
          averagePlatformRating,
          totalReviews,
        },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching dashboard data',
      data: null,
      errors: null,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      role,
      search,
      sort = DEFAULT_SORT,
    } = req.query;

    const filter = buildUserSearchFilter(search);
    if (role) {
      filter.role = role;
    }

    const sortOption = SORT_MAP[sort] || SORT_MAP[DEFAULT_SORT];

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const users = await User.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users: users.map(buildAdminUserListItem),
        pagination: { page, limit, total, totalPages },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching users',
      data: null,
      errors: null,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: { user: buildAdminUserDetail(user) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the user',
      data: null,
      errors: null,
    });
  }
};

const getAllRepairShops = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      status,
      search,
      sort = DEFAULT_SORT,
    } = req.query;

    const filter = buildShopSearchFilter(search);
    if (status) {
      filter.status = status;
    }

    const sortOption = SORT_MAP[sort] || SORT_MAP[DEFAULT_SORT];

    const total = await RepairShop.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const shops = await RepairShop.find(filter)
      .populate('ownerId', 'name email')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Repair shops fetched successfully',
      data: {
        repairShops: shops.map(buildAdminRepairShopListItem),
        pagination: { page, limit, total, totalPages },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching repair shops',
      data: null,
      errors: null,
    });
  }
};

const getRepairShopDetail = async (req, res) => {
  try {
    const shop = await RepairShop.findById(req.params.id).populate('ownerId', 'name email phone');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repair shop fetched successfully',
      data: { repairShop: buildAdminRepairShopDetail(shop) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the repair shop',
      data: null,
      errors: null,
    });
  }
};

const verifyRepairShop = async (req, res) => {
  try {
    const shop = await performShopStatusUpdate(req.params.id, 'verified');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repair shop verified successfully',
      data: {
        repairShop: buildAdminRepairShopDetail(shop),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while verifying the repair shop',
      data: null,
      errors: null,
    });
  }
};

const rejectRepairShop = async (req, res) => {
  try {
    const shop = await performShopStatusUpdate(req.params.id, 'rejected');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repair shop rejected successfully',
      data: {
        repairShop: buildAdminRepairShopDetail(shop),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while rejecting the repair shop',
      data: null,
      errors: null,
    });
  }
};

const getAllServiceRequests = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      status,
      search,
      sort = DEFAULT_SORT,
    } = req.query;

    const filter = buildServiceRequestSearchFilter(search);
    if (status) {
      filter.status = status;
    }

    const sortOption = SORT_MAP[sort] || SORT_MAP[DEFAULT_SORT];

    const total = await ServiceRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'name')
      .populate('shopId', 'shopName')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Service requests fetched successfully',
      data: {
        serviceRequests: requests.map(buildAdminServiceRequestListItem),
        pagination: { page, limit, total, totalPages },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching service requests',
      data: null,
      errors: null,
    });
  }
};

const getServiceRequestDetail = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('shopId', 'shopName phone ownerId status');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service request fetched successfully',
      data: { serviceRequest: buildServiceRequestResponseWithContact(request) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the service request',
      data: null,
      errors: null,
    });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      sort = DEFAULT_SORT,
    } = req.query;

    const filter = buildReviewSearchFilter(search);
    const sortOption = REVIEW_SORT_MAP[sort] || REVIEW_SORT_MAP[DEFAULT_SORT];

    const total = await Review.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const reviews = await Review.find(filter)
      .populate('customerId', 'name')
      .populate('shopId', 'shopName')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews: reviews.map(buildAdminReviewListItem),
        pagination: { page, limit, total, totalPages },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching reviews',
      data: null,
      errors: null,
    });
  }
};

const getReviewDetail = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('shopId', 'shopName phone ownerId status');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review fetched successfully',
      data: { review: buildReviewResponse(review) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the review',
      data: null,
      errors: null,
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  getAllRepairShops,
  getRepairShopDetail,
  verifyRepairShop,
  rejectRepairShop,
  getAllServiceRequests,
  getServiceRequestDetail,
  getAllReviews,
  getReviewDetail,
};
