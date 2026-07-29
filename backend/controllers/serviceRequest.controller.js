const ServiceRequest = require('../models/serviceRequest.model');
const RepairShop = require('../models/repairShop.model');
const Review = require('../models/review.model');
const { recalculateShopRating } = require('../utils/rating.util');
const {
  buildServiceRequestResponse,
  buildServiceRequestResponseWithContact,
} = require('../mappers/serviceRequest.mapper');
const { buildReviewResponse } = require('../mappers/review.mapper');

const EXPIRABLE_STATUSES = ['pending', 'quoted'];
const ACTIVE_REQUEST_STATUSES = ['pending', 'quoted', 'accepted', 'in_progress'];
const CUSTOMER_POPULATE_FIELDS = 'name phone';
const SHOP_POPULATE_FIELDS = 'shopName phone ownerId status';
const CONTACT_VISIBLE_STATUSES = ['accepted', 'in_progress', 'completed'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE =
  'You are not authorized to update this service request';
const SERVICE_REQUEST_ACCESS_UNAUTHORIZED_MESSAGE =
  'You are not authorized to access this service request';

const REVIEW_ACCESS_UNAUTHORIZED_MESSAGE =
  'You are not authorized to access this review';

const REVIEW_CREATION_UNAUTHORIZED_MESSAGE =
  'You are not authorized to review this service request';
const REVIEW_UPDATE_UNAUTHORIZED_MESSAGE =
  'You are not authorized to update this review';
const REVIEW_DELETE_UNAUTHORIZED_MESSAGE =
  'You are not authorized to delete this review';
const SERVICE_REQUEST_NOT_COMPLETED_MESSAGE = 'Service request is not completed';
const REVIEW_NOT_FOUND_MESSAGE = 'Review not found';
const REVIEW_ALREADY_EXISTS_MESSAGE = 'You have already reviewed this service request';

const DEFAULT_REVIEW_PAGE = 1;
const DEFAULT_REVIEW_LIMIT = 20;

const loadServiceRequest = async (id) => {
  return ServiceRequest.findById(id)
    .populate('customerId', CUSTOMER_POPULATE_FIELDS)
    .populate('shopId', SHOP_POPULATE_FIELDS);
};

const loadRepairShop = async (id) => {
  return RepairShop.findById(id);
};

const applyLazyExpiration = async (request) => {
  const isExpirable = EXPIRABLE_STATUSES.includes(request.status);
  const isPastDeadline = Date.now() > request.expiresAt.getTime();

  if (isExpirable && isPastDeadline) {
    request.status = 'expired';
    await request.save();
  }

  return request;
};

const mapServiceRequest = (request) => {
  return CONTACT_VISIBLE_STATUSES.includes(request.status)
    ? buildServiceRequestResponseWithContact(request)
    : buildServiceRequestResponse(request);
};

const paginateServiceRequests = async (filter, { page, limit }) => {
  const total = await ServiceRequest.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const requests = await ServiceRequest.find(filter)
    .populate('customerId', CUSTOMER_POPULATE_FIELDS)
    .populate('shopId', SHOP_POPULATE_FIELDS)
    .skip((page - 1) * limit)
    .limit(limit);

  const currentRequests = await Promise.all(requests.map(applyLazyExpiration));

  return {
    data: currentRequests.map(mapServiceRequest),
    pagination: { page, limit, total, totalPages },
  };
};

const DEFAULT_SERVICE_REQUEST_TIMEOUT_MINUTES = 60;

const createServiceRequest = async (req, res) => {
  try {
    const { shopId, vehicleType, issueDescription, location } = req.body;

    const shop = await loadRepairShop(shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'This repair shop is not currently verified',
        data: null,
        errors: null,
      });
    }

    if (!shop.vehicleTypesServiced.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'This repair shop does not service the selected vehicle type',
        data: null,
        errors: null,
      });
    }

    const existingRequest = await ServiceRequest.findOne({
      customerId: req.user._id,
      shopId,
      status: { $in: ACTIVE_REQUEST_STATUSES },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active request with this repair shop',
        data: null,
        errors: null,
      });
    }

    const configuredTimeout = Number(process.env.SERVICE_REQUEST_TIMEOUT_MINUTES);
    const timeoutMinutes =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_SERVICE_REQUEST_TIMEOUT_MINUTES;

    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const request = new ServiceRequest({
      customerId: req.user._id,
      shopId,
      vehicleType,
      issueDescription,
      location,
      expiresAt,
    });

    await request.save();

    const populatedRequest = await loadServiceRequest(request._id);

    return res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: {
        serviceRequest: buildServiceRequestResponse(populatedRequest),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the service request',
      data: null,
      errors: null,
    });
  }
};

const QUOTABLE_STATUSES = ['pending'];

const quoteServiceRequest = async (req, res) => {
  try {
    const { estimatedCost, estimatedDuration, mechanicNotes } = req.body ?? {};

    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    const shop = request.shopId;

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'This repair shop is not currently verified',
        data: null,
        errors: null,
      });
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!QUOTABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be quoted',
        data: null,
        errors: null,
      });
    }

    request.estimatedCost = estimatedCost;
    request.estimatedDuration = estimatedDuration;

    if (mechanicNotes !== undefined) {
      request.mechanicNotes = mechanicNotes;
    }

    request.status = 'quoted';

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request quoted successfully',
      data: {
        serviceRequest: buildServiceRequestResponse(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while quoting the service request',
      data: null,
      errors: null,
    });
  }
};

const REJECTABLE_STATUSES = ['pending'];

const rejectServiceRequest = async (req, res) => {
  try {
    const { mechanicNotes } = req.body ?? {};

    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    const shop = request.shopId;

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'This repair shop is not currently verified',
        data: null,
        errors: null,
      });
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!REJECTABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be rejected',
        data: null,
        errors: null,
      });
    }

    request.status = 'rejected';

    if (mechanicNotes !== undefined) {
      request.mechanicNotes = mechanicNotes;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request rejected successfully',
      data: {
        serviceRequest: buildServiceRequestResponse(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while rejecting the service request',
      data: null,
      errors: null,
    });
  }
};

const ACCEPTABLE_STATUSES = ['quoted'];

const acceptServiceRequest = async (req, res) => {
  try {
    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    if (request.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!ACCEPTABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be accepted',
        data: null,
        errors: null,
      });
    }

    request.status = 'accepted';

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request accepted successfully',
      data: {
        serviceRequest: buildServiceRequestResponseWithContact(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while accepting the service request',
      data: null,
      errors: null,
    });
  }
};

const CANCELLABLE_STATUSES = ['pending', 'quoted'];

const cancelServiceRequest = async (req, res) => {
  try {
    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    if (request.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!CANCELLABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be cancelled',
        data: null,
        errors: null,
      });
    }

    request.status = 'cancelled';

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request cancelled successfully',
      data: {
        serviceRequest: buildServiceRequestResponse(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while cancelling the service request',
      data: null,
      errors: null,
    });
  }
};

const STARTABLE_STATUSES = ['accepted'];

const startServiceRequest = async (req, res) => {
  try {
    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    const shop = request.shopId;

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'This repair shop is not currently verified',
        data: null,
        errors: null,
      });
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!STARTABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be started',
        data: null,
        errors: null,
      });
    }

    request.status = 'in_progress';

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request started successfully',
      data: {
        serviceRequest: buildServiceRequestResponseWithContact(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while starting the service request',
      data: null,
      errors: null,
    });
  }
};

const COMPLETABLE_STATUSES = ['in_progress'];

const completeServiceRequest = async (req, res) => {
  try {
    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    const shop = request.shopId;

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'This repair shop is not currently verified',
        data: null,
        errors: null,
      });
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (!COMPLETABLE_STATUSES.includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: 'This service request cannot be completed',
        data: null,
        errors: null,
      });
    }

    request.status = 'completed';

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Service request completed successfully',
      data: {
        serviceRequest: buildServiceRequestResponseWithContact(request),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while completing the service request',
      data: null,
      errors: null,
    });
  }
};

const getMyServiceRequests = async (req, res) => {
  try {
    const { status, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

    const filter = {
      customerId: req.user._id,
      ...(status && { status }),
    };

    const { data, pagination } = await paginateServiceRequests(filter, { page, limit });

    return res.status(200).json({
      success: true,
      message: 'Service requests fetched successfully',
      data: { serviceRequests: data, pagination },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching your service requests',
      data: null,
      errors: null,
    });
  }
};

const getShopServiceRequests = async (req, res) => {
  try {
    const shop = await RepairShop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'You have not created a repair shop yet',
        data: null,
        errors: null,
      });
    }

    const { status, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

    const filter = {
      shopId: shop._id,
      ...(status && { status }),
    };

    const { data, pagination } = await paginateServiceRequests(filter, { page, limit });

    return res.status(200).json({
      success: true,
      message: 'Service requests fetched successfully',
      data: { serviceRequests: data, pagination },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching shop service requests',
      data: null,
      errors: null,
    });
  }
};

const getServiceRequestById = async (req, res) => {
  try {
    let request = await loadServiceRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    request = await applyLazyExpiration(request);

    const isOwningCustomer = request.customerId._id.toString() === req.user._id.toString();
    const isOwningMechanic = request.shopId.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwningCustomer && !isOwningMechanic && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: SERVICE_REQUEST_ACCESS_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service request fetched successfully',
      data: { serviceRequest: mapServiceRequest(request) },
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

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const serviceRequest = await loadServiceRequest(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    if (serviceRequest.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: SERVICE_REQUEST_NOT_COMPLETED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (serviceRequest.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: REVIEW_CREATION_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const existingReview = await Review.findOne({ serviceRequestId: serviceRequest._id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: REVIEW_ALREADY_EXISTS_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const review = await Review.create({
      serviceRequestId: serviceRequest._id,
      customerId: req.user._id,
      shopId: serviceRequest.shopId._id,
      rating,
      comment,
    });

    await recalculateShopRating(serviceRequest.shopId._id);

    const populatedReview = await Review.findById(review._id)
      .populate('customerId', 'name')
      .populate('shopId', 'shopName');

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: buildReviewResponse(populatedReview) },
      errors: null,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: REVIEW_ALREADY_EXISTS_MESSAGE,
        data: null,
        errors: null,
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the review',
      data: null,
      errors: null,
    });
  }
};

const getReview = async (req, res) => {
  try {
    const serviceRequest = await loadServiceRequest(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        data: null,
        errors: null,
      });
    }

    const isOwningCustomer = serviceRequest.customerId._id.toString() === req.user._id.toString();
    const isOwningMechanic = serviceRequest.shopId.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwningCustomer && !isOwningMechanic && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: REVIEW_ACCESS_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const review = await Review.findOne({ serviceRequestId: serviceRequest._id })
      .populate('customerId', 'name')
      .populate('shopId', 'shopName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: REVIEW_NOT_FOUND_MESSAGE,
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

const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({ serviceRequestId: req.params.id })
      .populate('customerId', 'name')
      .populate('shopId', 'shopName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: REVIEW_NOT_FOUND_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: REVIEW_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (review.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: REVIEW_UPDATE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await recalculateShopRating(review.shopId._id.toString());

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review: buildReviewResponse(review) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating the review',
      data: null,
      errors: null,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ serviceRequestId: req.params.id });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: REVIEW_NOT_FOUND_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: REVIEW_DELETE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (review.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: REVIEW_DELETE_UNAUTHORIZED_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const shopId = review.shopId.toString();
    await review.deleteOne();
    await recalculateShopRating(shopId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: null,
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while deleting the review',
      data: null,
      errors: null,
    });
  }
};

module.exports = {
  createServiceRequest,
  quoteServiceRequest,
  rejectServiceRequest,
  acceptServiceRequest,
  cancelServiceRequest,
  startServiceRequest,
  completeServiceRequest,
  getMyServiceRequests,
  getShopServiceRequests,
  getServiceRequestById,
  createReview,
  getReview,
  updateReview,
  deleteReview,
};