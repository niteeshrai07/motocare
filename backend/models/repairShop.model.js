const mongoose = require('mongoose');

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
    // GeoJSON Point
    // Coordinates are stored as [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [longitude, latitude] = coords;
            return (
              Number.isFinite(longitude) &&
              Number.isFinite(latitude) &&
              longitude >= -180 &&
              longitude <= 180 &&
              latitude >= -90 &&
              latitude <= 90
            );
          },
          message:
            'Coordinates must be in the format [longitude, latitude], with longitude between -180 and 180 and latitude between -90 and 90',
        },
      },
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