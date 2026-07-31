export const setupNotificationSocket = (io, socket) => {
  socket.on('mark_notification_read', (notificationId) => {
    socket.emit('notification_status_updated', { notificationId, isRead: true });
  });
};

export const sendRealtimeNotification = (io, recipientId, notification) => {
  if (io && recipientId) {
    io.to(`user:${recipientId}`).emit('new_notification', notification);
  }
};
