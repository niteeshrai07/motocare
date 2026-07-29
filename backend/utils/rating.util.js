const mongoose = require('mongoose');
const RepairShop = require('../models/repairShop.model');
const Review = require('../models/review.model');

const roundRating = (value) => {
  return Math.round(value * 100) / 100;
};

const recalculateShopRating = async (shopId) => {
  const result = await Review.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = result[0]?.avgRating ?? 0;
  const count = result[0]?.count ?? 0;

  await RepairShop.findByIdAndUpdate(shopId, {
    rating: roundRating(avgRating),
    totalReviews: count,
  });
};

module.exports = {
  roundRating,
  recalculateShopRating,
};
