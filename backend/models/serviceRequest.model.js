const mongoose = require('mongoose');
const geoPointSchema = require('./shared/geoPoint.schema');

const SERVICE_REQUEST_STATUSES = [
  'pending',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
  'expired',
];

const serviceRequestSchema = new mongoose.Schema(
  {
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
    vehicleType: {
      type: String,
      enum: ['two_wheeler', 'four_wheeler'],
      required: true,
    },
    issueDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    // GeoJSON Point (see models/shared/geoPoint.schema.js)
    // Represents the breakdown location, not the shop's location.
    location: {
      type: geoPointSchema,
      required: true,
    },
    status: {
      type: String,
      enum: SERVICE_REQUEST_STATUSES,
      default: 'pending',
    },
    estimatedCost: {
      type: Number,
      min: 0,
    },
    estimatedDuration: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    mechanicNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Computed by the controller at creation time (createdAt + configured
    // timeout, e.g. SERVICE_REQUEST_TIMEOUT_MINUTES). Used for lazy
    // expiration checks on read — no schema default or save hook, since
    // this value depends on application configuration, not document state.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'servicerequests',
    versionKey: false,
  }
);

// Explicit, intentional indexes (kept in one place for easy review)
serviceRequestSchema.index({ customerId: 1 });
serviceRequestSchema.index({ shopId: 1, status: 1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
module.exports.SERVICE_REQUEST_STATUSES = SERVICE_REQUEST_STATUSES;