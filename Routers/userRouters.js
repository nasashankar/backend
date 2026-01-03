import express from 'express';
import { forgetPassword, sendForgetPasswordLink, updateProfile, uploadMiddleware,  } from '../Controllers/userControllers.js';
import { verifyToken } from '../Middleware/verifyToken.js';
import { getProfile, googleAuth, loginUser, registerUser, resendOtp, verifyOtp } from '../Controllers/authController.js';

const router = express.Router();
// router.post('/register',registerUser)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.post("/login",loginUser)
router.post("/google",googleAuth)
router.get("/get-details",verifyToken,getProfile)
router.post("/update-profile",verifyToken,uploadMiddleware, updateProfile)
router.post("/forget-password",forgetPassword)
router.post("/send-forget-password",sendForgetPasswordLink);
router.post("/register",registerUser)


export default router;