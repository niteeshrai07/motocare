const RepairShop = require('../models/repairShop.model');
const Review = require('../models/review.model');
const {
  buildMechanicRepairShopResponse,
  buildPublicRepairShopResponse,
  buildAdminRepairShopResponse,
} = require('../mappers/repairShop.mapper');
const { buildReviewListItem } = require('../mappers/review.mapper');

const DUPLICATE_SHOP_MESSAGE = 'You already have a repair shop';
const SHOP_NOT_FOUND_MESSAGE = 'You have not created a repair shop yet';
const EMPTY_UPDATE_MESSAGE = 'No valid fields were provided for update.';
const DEFAULT_RADIUS_KM = 10;
const MAX_RADIUS_KM = 50;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const DEFAULT_REVIEW_PAGE = 1;
const DEFAULT_REVIEW_LIMIT = 20;

const buildCreateRepairShopData = (body) => {
  return {
    shopName: body.shopName,
    vehicleTypesServiced: body.vehicleTypesServiced,
    location: body.location,
    address: body.address,
    phone: body.phone,
    description: body.description,
    openingHours: body.openingHours,
    photoUrl: body.photoUrl,
  };
};

const buildUpdateRepairShopData = (body) => {
  const updates = {};

  if ('shopName' in body) updates.shopName = body.shopName;
  if ('vehicleTypesServiced' in body) updates.vehicleTypesServiced = body.vehicleTypesServiced;
  if ('location' in body) updates.location = body.location;
  if ('address' in body) updates.address = body.address;
  if ('phone' in body) updates.phone = body.phone;
  if ('description' in body) updates.description = body.description;
  if ('openingHours' in body) updates.openingHours = body.openingHours;
  if ('photoUrl' in body) updates.photoUrl = body.photoUrl;

  return updates;
};

const arraysAreEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const locationsAreEqual = (locationA, locationB) => {
  if (!locationA || !locationB) {
    return false;
  }
  return (
    locationA.type === locationB.type &&
    locationA.coordinates[0] === locationB.coordinates[0] &&
    locationA.coordinates[1] === locationB.coordinates[1]
  );
};

const requiresReVerification = (existingShop, updates) => {
  if ('shopName' in updates && updates.shopName !== existingShop.shopName) {
    return true;
  }

  if ('address' in updates && updates.address !== existingShop.address) {
    return true;
  }

  if (
    'vehicleTypesServiced' in updates &&
    !arraysAreEqual(updates.vehicleTypesServiced, existingShop.vehicleTypesServiced)
  ) {
    return true;
  }

  if ('location' in updates && !locationsAreEqual(updates.location, existingShop.location)) {
    return true;
  }

  return false;
};

const createRepairShop = async (req, res) => {
  try {
    // Business rule: one shop per mechanic (primary check; unique index is the backup)
    const existingShop = await RepairShop.findOne({ ownerId: req.user._id });
    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: DUPLICATE_SHOP_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const shopData = buildCreateRepairShopData(req.body);

    const shop = new RepairShop({
      ...shopData,
      ownerId: req.user._id,
      status: 'pending',
    });

    await shop.save();

    return res.status(201).json({
      success: true,
      message: 'Repair shop created successfully',
      data: {
        repairShop: buildMechanicRepairShopResponse(shop),
      },
      errors: null,
    });
  } catch (err) {
    // Race condition fallback: two concurrent requests could both pass the findOne()
    // check above; the unique index on ownerId is the ultimate guarantee.
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: DUPLICATE_SHOP_MESSAGE,
        data: null,
        errors: null,
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the repair shop',
      data: null,
      errors: null,
    });
  }
};

const getMyRepairShop = async (req, res) => {
  try {
    const shop = await RepairShop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: SHOP_NOT_FOUND_MESSAGE,
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repair shop fetched successfully',
      data: {
        repairShop: buildMechanicRepairShopResponse(shop),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching your repair shop',
      data: null,
      errors: null,
    });
  }
};

const updateMyRepairShop = async (req, res) => {
  try {
    const shop = await RepairShop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: SHOP_NOT_FOUND_MESSAGE,
        data: null,
        errors: null,
      });
    }

    const updates = buildUpdateRepairShopData(req.body ?? {});

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: EMPTY_UPDATE_MESSAGE,
        data: null,
        errors: null,
      });
    }

    if (requiresReVerification(shop, updates)) {
      updates.status = 'pending';
    }

    Object.assign(shop, updates);
    await shop.save();

    return res.status(200).json({
      success: true,
      message: 'Repair shop updated successfully',
      data: {
        repairShop: buildMechanicRepairShopResponse(shop),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating your repair shop',
      data: null,
      errors: null,
    });
  }
};


const getNearbyRepairShops = async (req, res) => {
  try {
    const {
      lng,
      lat,
      radius,
      vehicleType,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const radiusKm = Math.min(radius || DEFAULT_RADIUS_KM, MAX_RADIUS_KM);

    const filter = {
      status: 'verified',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000, // convert km to meters
        },
      },
    };

    if (vehicleType) {
      filter.vehicleTypesServiced = vehicleType;
    }

    const shops = await RepairShop.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Nearby repair shops fetched successfully',
      data: {
        repairShops: shops.map(buildPublicRepairShopResponse),
        pagination: {
          page,
          limit,
        },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching nearby repair shops',
      data: null,
      errors: null,
    });
  }
};

const getRepairShopById = async (req, res) => {
  try {
    const shop = await RepairShop.findOne({
      _id: req.params.id,
      status: 'verified',
    });

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
      data: {
        repairShop: buildPublicRepairShopResponse(shop),
      },
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


const listRepairShops = async (req, res) => {
  try {
    const {
      status,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const total = await RepairShop.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const shops = await RepairShop.find(filter)
      .populate('ownerId')
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Repair shops fetched successfully',
      data: {
        repairShops: shops.map(buildAdminRepairShopResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
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

const verifyRepairShop = async (req, res) => {
  try {
    const { status } = req.body;

    const shop = await RepairShop.findById(req.params.id).populate('ownerId');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    shop.status = status;
    await shop.save();

    return res.status(200).json({
      success: true,
      message: `Repair shop ${status} successfully`,
      data: {
        repairShop: buildAdminRepairShopResponse(shop),
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating the repair shop status',
      data: null,
      errors: null,
    });
  }
};

const REVIEW_SORT_MAP = {
  newest: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const listShopReviews = async (req, res) => {
  try {
    const shop = await RepairShop.findById(req.params.shopId);

    if (!shop || shop.status !== 'verified') {
      return res.status(404).json({
        success: false,
        message: 'Repair shop not found',
        data: null,
        errors: null,
      });
    }

    const { page = DEFAULT_REVIEW_PAGE, limit = DEFAULT_REVIEW_LIMIT, sort = 'newest' } = req.query;

    const total = await Review.countDocuments({ shopId: shop._id });
    const totalPages = Math.ceil(total / limit);

    // totalPages = 0 when total = 0 is intentional and consistent with
    // pagination behavior in the existing service request module.

    const reviews = await Review.find({ shopId: shop._id })
      .populate('customerId', 'name')
      .populate('shopId', 'shopName')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(REVIEW_SORT_MAP[sort]);

    return res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews: reviews.map(buildReviewListItem),
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

module.exports = {
  createRepairShop,
  getMyRepairShop,
  updateMyRepairShop,
  getNearbyRepairShops,
  getRepairShopById,
  listRepairShops,
  verifyRepairShop,
  listShopReviews,
};