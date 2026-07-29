const buildNotificationResponse = (notification) => {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId?.toString() ?? null,
    metadata: notification.metadata ?? {},
    read: notification.read,
    archived: notification.archived,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

module.exports = {
  buildNotificationResponse,
};
