import express from 'express';
import { createAudition, deleteAudition, getAllAuditions, getAuditionById, getAuditionsByUserId, uploadMiddleware } from '../Controllers/auditionController.js';



const router = express.Router();
router.post("/create-audition", uploadMiddleware, createAudition)
router.get("/get-all",getAllAuditions)
router.get("/get-all/:id",uploadMiddleware , getAuditionById)
router.get("/get-all-user/:userId",uploadMiddleware,getAuditionsByUserId)
router.put("/update-audi/:id",uploadMiddleware)
router.delete("/delete-audi/:id",deleteAudition)

export default router;