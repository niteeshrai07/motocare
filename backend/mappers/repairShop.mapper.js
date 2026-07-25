const buildBaseFields = (shop) => ({
  id: shop._id.toString(),
  shopName: shop.shopName,
  vehicleTypesServiced: shop.vehicleTypesServiced,
  location: shop.location,
  address: shop.address,
  phone: shop.phone,
  description: shop.description,
  openingHours: shop.openingHours,
  photoUrl: shop.photoUrl,
  rating: shop.rating,
});

const buildOwner = (shop) => {
  // Only build an owner object if ownerId was actually populated on this document
  if (!shop.populated('ownerId')) return null;

  const owner = shop.ownerId;
  return {
    id: owner._id.toString(),
    name: owner.name,
    phone: owner.phone,
  };
};

const buildPublicRepairShopResponse = (shop) => {
  return buildBaseFields(shop);
};

const buildMechanicRepairShopResponse = (shop) => {
  return {
    ...buildPublicRepairShopResponse(shop),
    status: shop.status,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
};

const buildAdminRepairShopResponse = (shop) => {
  return {
    ...buildMechanicRepairShopResponse(shop),
    owner: buildOwner(shop),
  };
};

module.exports = {
  buildPublicRepairShopResponse,
  buildMechanicRepairShopResponse,
  buildAdminRepairShopResponse,
};