const mongoose = require('mongoose');

const INVALID_COORDINATE_MESSAGE =
  'Coordinates must be in the format [longitude, latitude], with longitude between -180 and 180 and latitude between -90 and 90';

const isValidCoordinatePair = (coords) => {
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
};

// Reusable GeoJSON Point sub-schema.
// Coordinates are stored as [longitude, latitude].
const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: isValidCoordinatePair,
        message: INVALID_COORDINATE_MESSAGE,
      },
    },
  },
  { _id: false }
);

module.exports = geoPointSchema;