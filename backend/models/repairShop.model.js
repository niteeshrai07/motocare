const mongoose = require('mongoose');
const geoPointSchema = require('./shared/geoPoint.schema');

const repairShopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    vehicleTypesServiced: {
      type: [String],
      enum: ['two_wheeler', 'four_wheeler'],
      required: true,
    },
    // GeoJSON Point (see models/shared/geoPoint.schema.js)
    location: {
      type: geoPointSchema,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    openingHours: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    photoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => {
          if (!value) return true; // optional field
          return /^https?:\/\/.+/i.test(value);
        },
        message: 'Photo URL must be a valid HTTP or HTTPS URL.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'repairshops',
    versionKey: false,
  }
);

// Explicit, intentional indexes (kept in one place for easy review)
repairShopSchema.index({ location: '2dsphere' });
repairShopSchema.index({ ownerId: 1 }, { unique: true });
repairShopSchema.index({ status: 1 });

module.exports = mongoose.model('RepairShop', repairShopSchema);