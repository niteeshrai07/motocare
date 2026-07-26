const express = require('express');
const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');
const handleValidationErrors = require('../middleware/validation.middleware');

const {
  createServiceRequestValidator,
  acceptServiceRequestValidator,
  cancelServiceRequestValidator,
  quoteServiceRequestValidator,
  rejectServiceRequestValidator,
  startServiceRequestValidator,
  completeServiceRequestValidator,
} = require('../validators/serviceRequest.validator');

const {
  createServiceRequest,
  acceptServiceRequest,
  cancelServiceRequest,
  quoteServiceRequest,
  rejectServiceRequest,
  startServiceRequest,
  completeServiceRequest,
} = require('../controllers/serviceRequest.controller');

// Customer routes
router.post(
  '/',
  verifyToken,
  authorizeRoles('customer'),
  createServiceRequestValidator,
  handleValidationErrors,
  createServiceRequest
);

router.patch(
  '/:id/accept',
  verifyToken,
  authorizeRoles('customer'),
  acceptServiceRequestValidator,
  handleValidationErrors,
  acceptServiceRequest
);

router.patch(
  '/:id/cancel',
  verifyToken,
  authorizeRoles('customer'),
  cancelServiceRequestValidator,
  handleValidationErrors,
  cancelServiceRequest
);

// Mechanic routes
router.patch(
  '/:id/quote',
  verifyToken,
  authorizeRoles('mechanic'),
  quoteServiceRequestValidator,
  handleValidationErrors,
  quoteServiceRequest
);

router.patch(
  '/:id/reject',
  verifyToken,
  authorizeRoles('mechanic'),
  rejectServiceRequestValidator,
  handleValidationErrors,
  rejectServiceRequest
);

router.patch(
  '/:id/start',
  verifyToken,
  authorizeRoles('mechanic'),
  startServiceRequestValidator,
  handleValidationErrors,
  startServiceRequest
);

router.patch(
  '/:id/complete',
  verifyToken,
  authorizeRoles('mechanic'),
  completeServiceRequestValidator,
  handleValidationErrors,
  completeServiceRequest
);

module.exports = router;