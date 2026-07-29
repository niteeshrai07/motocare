const Notification = require('../models/notification.model');
const { buildNotificationResponse } = require('../mappers/notification.mapper');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEFAULT_SORT = 'newest';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

const buildListFilter = (userId, { unreadOnly = false, archived = false }) => {
  const filter = { recipientId: userId };
  const isArchived = archived === true || archived === 'true';

  filter.archived = isArchived;

  if (unreadOnly) {
    filter.read = false;
  }

  return filter;
};

const getMyNotifications = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      unreadOnly = false,
      archived = false,
      sort = DEFAULT_SORT,
    } = req.query;

    const filter = buildListFilter(req.user._id, { unreadOnly, archived });
    const sortOption = SORT_MAP[sort] || SORT_MAP[DEFAULT_SORT];

    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const notifications = await Notification.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false,
      archived: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications: notifications.map(buildNotificationResponse),
        pagination: { page, limit, total, totalPages, unreadCount },
      },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching notifications',
      data: null,
      errors: null,
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null,
        errors: null,
      });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this notification',
        data: null,
        errors: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification fetched successfully',
      data: { notification: buildNotificationResponse(notification) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the notification',
      data: null,
      errors: null,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null,
        errors: null,
      });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this notification',
        data: null,
        errors: null,
      });
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification: buildNotificationResponse(notification) },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while marking the notification as read',
      data: null,
      errors: null,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, read: false, archived: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: result.modifiedCount },
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while marking notifications as read',
      data: null,
      errors: null,
    });
  }
};

const archiveNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null,
        errors: null,
      });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this notification',
        data: null,
        errors: null,
      });
    }

    if (!notification.archived) {
      notification.archived = true;
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Notification archived',
      data: null,
      errors: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while archiving the notification',
      data: null,
      errors: null,
    });
  }
};

module.exports = {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
};
