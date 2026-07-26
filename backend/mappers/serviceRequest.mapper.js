const buildBaseFields = (request) => ({
  id: request._id.toString(),
  vehicleType: request.vehicleType,
  issueDescription: request.issueDescription,
  location: request.location,
  status: request.status,
  estimatedCost: request.estimatedCost,
  estimatedDuration: request.estimatedDuration,
  mechanicNotes: request.mechanicNotes,
  expiresAt: request.expiresAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const buildCustomerSummary = (request) => {
  if (!request.populated('customerId')) return null;

  const customer = request.customerId;
  return {
    id: customer._id.toString(),
    name: customer.name,
  };
};

const buildCustomerSummaryWithContact = (request) => {
  if (!request.populated('customerId')) return null;

  const customer = request.customerId;
  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
  };
};

const buildShopSummary = (request) => {
  if (!request.populated('shopId')) return null;

  const shop = request.shopId;
  return {
    id: shop._id.toString(),
    shopName: shop.shopName,
  };
};

const buildShopSummaryWithContact = (request) => {
  if (!request.populated('shopId')) return null;

  const shop = request.shopId;
  return {
    id: shop._id.toString(),
    shopName: shop.shopName,
    phone: shop.phone,
  };
};

const buildServiceRequestResponse = (request) => {
  return {
    ...buildBaseFields(request),
    customer: buildCustomerSummary(request),
    shop: buildShopSummary(request),
  };
};

const buildServiceRequestResponseWithContact = (request) => {
  return {
    ...buildBaseFields(request),
    customer: buildCustomerSummaryWithContact(request),
    shop: buildShopSummaryWithContact(request),
  };
};

module.exports = {
  buildServiceRequestResponse,
  buildServiceRequestResponseWithContact,
};