const buildCustomerSummary = (review) => {
  if (!review.populated('customerId')) return null;

  const customer = review.customerId;
  return {
    id: customer._id.toString(),
    name: customer.name,
  };
};

const buildShopSummary = (review) => {
  if (!review.populated('shopId')) return null;

  const shop = review.shopId;
  return {
    id: shop._id.toString(),
    shopName: shop.shopName,
  };
};

const buildReviewResponse = (review) => {
  return {
    id: review._id.toString(),
    serviceRequestId: review.serviceRequestId.toString(),
    customer: buildCustomerSummary(review),
    shop: buildShopSummary(review),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
};

const buildReviewListItem = (review) => {
  return {
    id: review._id.toString(),
    customer: buildCustomerSummary(review),
    shop: buildShopSummary(review),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
};

module.exports = {
  buildReviewResponse,
  buildReviewListItem,
};
