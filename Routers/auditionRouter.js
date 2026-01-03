import express from 'express';
import { createAudition,} from '../Controllers/auditionController.js';
import { verifyToken } from '../Middleware/verifyToken.js';



const router = express.Router();
router.post("/create-audition", verifyToken, createAudition)


export default router;