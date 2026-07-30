const express = require('express');
const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');
const handleValidationErrors = require('../middleware/validation.middleware');

const {
  listUsersValidator,
  getUserIdValidator,
  listRepairShopsValidator,
  getRepairShopIdValidator,
  verifyRepairShopValidator,
  rejectRepairShopValidator,
  listServiceRequestsValidator,
  getServiceRequestIdValidator,
  listReviewsValidator,
  getReviewIdValidator,
} = require('../validators/admin.validator');

const {
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
} = require('../controllers/admin.controller');

router.get(
  '/dashboard',
  verifyToken,
  authorizeRoles('admin'),
  handleValidationErrors,
  getDashboard
);

router.get(
  '/users',
  verifyToken,
  authorizeRoles('admin'),
  listUsersValidator,
  handleValidationErrors,
  getAllUsers
);

router.get(
  '/users/:id',
  verifyToken,
  authorizeRoles('admin'),
  getUserIdValidator,
  handleValidationErrors,
  getUserById
);

router.get(
  '/repair-shops',
  verifyToken,
  authorizeRoles('admin'),
  listRepairShopsValidator,
  handleValidationErrors,
  getAllRepairShops
);

router.get(
  '/repair-shops/:id',
  verifyToken,
  authorizeRoles('admin'),
  getRepairShopIdValidator,
  handleValidationErrors,
  getRepairShopDetail
);

router.patch(
  '/repair-shops/:id/verify',
  verifyToken,
  authorizeRoles('admin'),
  getRepairShopIdValidator,
  verifyRepairShopValidator,
  handleValidationErrors,
  verifyRepairShop
);

router.patch(
  '/repair-shops/:id/reject',
  verifyToken,
  authorizeRoles('admin'),
  getRepairShopIdValidator,
  rejectRepairShopValidator,
  handleValidationErrors,
  rejectRepairShop
);

router.get(
  '/service-requests',
  verifyToken,
  authorizeRoles('admin'),
  listServiceRequestsValidator,
  handleValidationErrors,
  getAllServiceRequests
);

router.get(
  '/service-requests/:id',
  verifyToken,
  authorizeRoles('admin'),
  getServiceRequestIdValidator,
  handleValidationErrors,
  getServiceRequestDetail
);

router.get(
  '/reviews',
  verifyToken,
  authorizeRoles('admin'),
  listReviewsValidator,
  handleValidationErrors,
  getAllReviews
);

router.get(
  '/reviews/:id',
  verifyToken,
  authorizeRoles('admin'),
  getReviewIdValidator,
  handleValidationErrors,
  getReviewDetail
);

module.exports = router;
