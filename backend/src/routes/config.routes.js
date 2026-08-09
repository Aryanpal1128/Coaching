import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/turn-config', (req, res) => {
  const turnUrl = process.env.TURN_URL || '';
  const turnUsername = process.env.TURN_USERNAME || '';
  const turnCredential = process.env.TURN_CREDENTIAL || '';

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (turnUrl) {
    const turnServer = { urls: turnUrl };
    if (turnUsername) turnServer.username = turnUsername;
    if (turnCredential) turnServer.credential = turnCredential;
    iceServers.push(turnServer);
  }

  return res.status(200).json(
    new ApiResponse(200, { iceServers }, 'ICE servers config fetched successfully')
  );
});

export default router;
