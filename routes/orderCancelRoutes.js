import express from 'express';
const router = express.Router();
import { 
 requestOrderCancellation , 

} from '../controllers/orderCancellationController.js';

// Import your existing auth middleware
import userAuth from "../middlewares/userAuth.js";

// --- USER ROUTE ---
// We use 'userAuth' because that's what you've already created/imported
router.post('/:id/cancel', userAuth, requestOrderCancellation);
// router.put('/approve/:id', adminAuth, approveCancellation);
// router.put('/reject/:id', adminAuth, rejectCancellation);
// --- ADMIN ROUTE (Commented out for now) ---
/* 
  Since you haven't created the 'admin' middleware yet, 
  keep this commented out so the server doesn't crash 
  on 'admin is not defined' error.
*/
// router.put('/admin/cancellation/:id', userAuth, processCancellationAdmin);

export default router;