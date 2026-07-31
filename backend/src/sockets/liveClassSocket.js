import logger from '../config/logger.js';

export const setupLiveClassSocket = (io, socket) => {
  // Join Live Class room
  socket.on('join_live_class', ({ classId, user }) => {
    socket.join(`live_class:${classId}`);
    socket.user = user; // Store user on socket for disconnect tracking
    logger.info(`User ${user?.name || socket.id} joined live class ${classId}`);
    
    socket.to(`live_class:${classId}`).emit('user_joined_class', {
      user,
      joinedAt: new Date()
    });
  });

  // Live Chat Message
  socket.on('send_class_chat', ({ classId, sender, message }) => {
    const payload = {
      sender,
      message,
      timestamp: new Date()
    };
    io.to(`live_class:${classId}`).emit('receive_class_chat', payload);
  });

  // Screen share signal toggle
  socket.on('screen_share_status', ({ classId, isSharing, teacherName }) => {
    socket.to(`live_class:${classId}`).emit('screen_share_updated', {
      isSharing,
      teacherName
    });
  });

  // Leave Live Class room manually
  socket.on('leave_live_class', ({ classId, user }) => {
    socket.leave(`live_class:${classId}`);
    socket.to(`live_class:${classId}`).emit('user_left_class', {
      user,
      leftAt: new Date()
    });
  });

  // Handle sudden disconnects
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      if (room.startsWith('live_class:')) {
        socket.to(room).emit('user_left_class', {
          user: socket.user || { name: 'A user' },
          leftAt: new Date()
        });
      }
    });
  });
};
