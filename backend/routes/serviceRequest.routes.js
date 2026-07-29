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
  listServiceRequestsValidator,
  getServiceRequestByIdValidator,
  createReviewValidator,
  updateReviewValidator,
} = require('../validators/serviceRequest.validator');

const {
  createServiceRequest,
  getMyServiceRequests,
  getShopServiceRequests,
  getServiceRequestById,
  acceptServiceRequest,
  cancelServiceRequest,
  quoteServiceRequest,
  rejectServiceRequest,
  startServiceRequest,
  completeServiceRequest,
  createReview,
  getReview,
  updateReview,
  deleteReview,
} = require('../controllers/serviceRequest.controller');

router.post(
  '/',
  verifyToken,
  authorizeRoles('customer'),
  createServiceRequestValidator,
  handleValidationErrors,
  createServiceRequest
);

router.get(
  '/my',
  verifyToken,
  authorizeRoles('customer'),
  listServiceRequestsValidator,
  handleValidationErrors,
  getMyServiceRequests
);

router.get(
  '/shop',
  verifyToken,
  authorizeRoles('mechanic'),
  listServiceRequestsValidator,
  handleValidationErrors,
  getShopServiceRequests
);

router.post(
  '/:id/review',
  verifyToken,
  authorizeRoles('customer'),
  getServiceRequestByIdValidator,
  createReviewValidator,
  handleValidationErrors,
  createReview
);

router.get(
  '/:id/review',
  verifyToken,
  getServiceRequestByIdValidator,
  handleValidationErrors,
  getReview
);

router.patch(
  '/:id/review',
  verifyToken,
  getServiceRequestByIdValidator,
  updateReviewValidator,
  handleValidationErrors,
  updateReview
);

router.delete(
  '/:id/review',
  verifyToken,
  getServiceRequestByIdValidator,
  handleValidationErrors,
  deleteReview
);

router.get(
  '/:id',
  verifyToken,
  getServiceRequestByIdValidator,
  handleValidationErrors,
  getServiceRequestById
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