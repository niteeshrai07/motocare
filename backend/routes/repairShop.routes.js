const express = require('express');
const router = express.Router();

const {
  createRepairShop,
  getMyRepairShop,
  updateMyRepairShop,
  getNearbyRepairShops,
  getRepairShopById,
  listRepairShops,
  verifyRepairShop,
} = require('../controllers/repairShop.controller');

const {
  createRepairShopValidator,
  updateRepairShopValidator,
  nearbyShopsValidator,
  getRepairShopByIdValidator,
  listRepairShopsValidator,
  verifyRepairShopStatusValidator,
} = require('../validators/repairShop.validator');

const handleValidationErrors = require('../middleware/validation.middleware');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Mechanic
router.post(
  '/',
  verifyToken,
  authorizeRoles('mechanic'),
  createRepairShopValidator,
  handleValidationErrors,
  createRepairShop
);

router.get('/me', verifyToken, authorizeRoles('mechanic'), getMyRepairShop);

router.patch(
  '/me',
  verifyToken,
  authorizeRoles('mechanic'),
  updateRepairShopValidator,
  handleValidationErrors,
  updateMyRepairShop
);

// Public
router.get('/nearby', nearbyShopsValidator, handleValidationErrors, getNearbyRepairShops);

// Admin (PATCH /:id/verify registered before GET /:id, per required ordering)
router.patch(
  '/:id/verify',
  verifyToken,
  authorizeRoles('admin'),
  ...getRepairShopByIdValidator,
  ...verifyRepairShopStatusValidator,
  handleValidationErrors,
  verifyRepairShop
);

// Public (parameterized — must come after /me, /nearby)
router.get('/:id', getRepairShopByIdValidator, handleValidationErrors, getRepairShopById);

// Admin
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  listRepairShopsValidator,
  handleValidationErrors,
  listRepairShops
);

module.exports = router;