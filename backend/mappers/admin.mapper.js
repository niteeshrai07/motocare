const buildAdminUserListItem = (user) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const buildAdminUserDetail = (user) => {
  return buildAdminUserListItem(user);
};

const buildAdminRepairShopListItem = (shop) => {
  return {
    id: shop._id.toString(),
    shopName: shop.shopName,
    status: shop.status,
    rating: shop.rating,
    totalReviews: shop.totalReviews,
    owner: shop.ownerId
      ? {
          id: shop.ownerId._id.toString(),
          name: shop.ownerId.name,
          email: shop.ownerId.email,
        }
      : null,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
};

const buildAdminRepairShopDetail = (shop) => {
  return buildAdminRepairShopListItem(shop);
};

const buildAdminServiceRequestListItem = (request) => {
  return {
    id: request._id.toString(),
    status: request.status,
    vehicleType: request.vehicleType,
    customer: request.customerId
      ? {
          id: request.customerId._id.toString(),
          name: request.customerId.name,
        }
      : null,
    shop: request.shopId
      ? {
          id: request.shopId._id.toString(),
          shopName: request.shopId.shopName,
        }
      : null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};

const buildAdminReviewListItem = (review) => {
  return {
    id: review._id.toString(),
    rating: review.rating,
    comment: review.comment,
    customer: review.customerId
      ? {
          id: review.customerId._id.toString(),
          name: review.customerId.name,
        }
      : null,
    shop: review.shopId
      ? {
          id: review.shopId._id.toString(),
          shopName: review.shopId.shopName,
        }
      : null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
};

module.exports = {
  buildAdminUserListItem,
  buildAdminUserDetail,
  buildAdminRepairShopListItem,
  buildAdminRepairShopDetail,
  buildAdminServiceRequestListItem,
  buildAdminReviewListItem,
};
