// routes/chatbotRoutes.js
import express           from 'express';
import { handleMessage } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/message', handleMessage);

export default router;