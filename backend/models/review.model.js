const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairShop',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
    versionKey: false,
  }
);

reviewSchema.index({ serviceRequestId: 1 }, { unique: true });
reviewSchema.index({ shopId: 1 });
reviewSchema.index({ customerId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
