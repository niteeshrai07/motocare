const Notification = require('../models/notification.model');

const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  resourceType = null,
  resourceId = null,
  metadata = {},
}) => {
  try {
    return await Notification.create({
      recipientId,
      type,
      title,
      message,
      resourceType,
      resourceId,
      metadata,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

module.exports = {
  createNotification,
};
