const buildProfileResponse = (user, shop = null) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    repairShop: shop
      ? {
          id: shop._id.toString(),
          shopName: shop.shopName,
          status: shop.status,
        }
      : null,
  };
};

module.exports = {
  buildProfileResponse,
};
