// controllers/authController.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../Models/userModels.js";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";



// Helper to create JWT (optional)
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET_KEY || "your_jwt_secret",
    { expiresIn: "7d" }
  );
};
// // Nodemailer transporter (Gmail example). Replace in production.
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 🔥 FIX
  },
});

// Register controller — expects firstName, lastName, email, password, confirmPassword, accountType, newsletter(optional)
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email: rawEmail,
      password,
      confirmPassword,
      accountType,
      newsletter,
    } = req.body;

    // Basic presence checks
    if (!firstName || !lastName || !rawEmail || !password || !confirmPassword || !accountType) {
      return res.status(400).json({
        message: "Missing required fields. Required: firstName, lastName, email, password, confirmPassword, accountType",
      });
    }

    // Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Password complexity (same rule you had)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*])[A-Za-z\d!@#$%&*]{8,20}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character, and be 8-20 characters long.",
      });
    }

    // Normalize email
    const email = String(rawEmail).trim().toLowerCase();

    // Quick duplicate check
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Validate accountType against model enum (defensive)
    const allowedAccountTypes = ["performer", "casting-director", "agent", "producer"];
    if (!allowedAccountTypes.includes(accountType)) {
      return res.status(400).json({ message: "Invalid accountType" });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit OTP (plain for email) and store hashed version
    const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHashed = crypto.createHash("sha256").update(otpPlain).digest("hex");
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Build user doc
    const user = new User({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email,
      password: hashedPassword, // model will accept this
      isGoogleUser: false,
      isVerified: false,
      otp: otpHashed,
      otpExpires,
      accountType,
      newsletter: !!newsletter,
    });

    await user.save();

    // Send OTP email (plain OTP)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your account - OTP",
        text: `Your verification code is ${otpPlain}. It will expire in 10 minutes.`,
        html: `<p>Your verification code is <strong>${otpPlain}</strong>. It will expire in 10 minutes.</p>`,
      });
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // Optionally remove created user to avoid orphaned unverified accounts:
      // await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: "Failed to send verification email. Try again later." });
    }

    // Optionally create JWT and set httpOnly cookie (uncomment if desired)
    // const token = generateToken(user);
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    // Return safe payload
    return res.status(201).json({
      message: "User registered successfully. Please verify your email using the OTP sent.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);

    // Handle duplicate-key race condition
    if (err.code === 11000) {
      const dupField = err.keyValue ? Object.keys(err.keyValue)[0] : "email";
      return res.status(409).json({ message: `${dupField} already in use` });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// ------------ VERIFY OTP ------------
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and otp are required" });
    }

    // load the user and include the hashed otp (otp is select:false in schema)
    const user = await User.findById(userId).select("+otp +otpExpires +isVerified");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // check expiry
    if (!user.otp || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not set. Please request a new one." });
    }

    // hash incoming otp and compare with stored hashed otp
    const hashedOtp = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (hashedOtp !== user.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark verified and clear otp fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // optionally issue JWT
    const token = generateToken(user); // optional helper you already have

    // Return minimal user info (avoid sending sensitive fields)
    return res.status(200).json({
      message: "OTP verified successfully. Account activated.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------ RESEND OTP ------------
export const resendOtp = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ message: "Email is required" });

    const email = String(rawEmail).trim().toLowerCase();

    const user = await User.findOne({ email }).select("+otpExpires +isVerified");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User is already verified" });

    // OPTIONAL: basic throttle - don't resend too often (example 60s)
    // You can customize or remove this; ideally use a dedicated rate limiter or an otpCreatedAt field.
    if (user.otpExpires && user.otpExpires.getTime() > Date.now() - (9 * 60 * 1000)) {
      // If an OTP was already created very recently we still allow resend,
      // but you can enforce stricter limits here.
      // (This example is permissive; for strict throttle implement otpCreatedAt or server-side rate-limiting.)
    }

    // generate new OTP, hash it, save expiry as Date
    const newOtpPlain = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpHashed = crypto.createHash("sha256").update(newOtpPlain).digest("hex");
    user.otp = newOtpHashed;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // send email (transporter should be configured)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your new verification code (OTP)",
        text: `Your new verification code is ${newOtpPlain}. It expires in 10 minutes.`,
        html: `<p>Your new verification code is <strong>${newOtpPlain}</strong>. It expires in 10 minutes.</p>`,
      });
    } catch (mailErr) {
      console.error("Resend OTP mail error:", mailErr);
      return res.status(500).json({ message: "Failed to send OTP email. Try again later." });
    }

    return res.status(200).json({ message: "New OTP sent successfully to your email." });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// -------------------- Login --------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Google users must login via Google
    if (user.isGoogleUser) {
      return res.status(400).json({ message: "Please login with Google" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🚨 IMPORTANT: Block login until OTP is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email with OTP before logging in",
        needsVerification: true,
        userId: user._id,
        email: user.email
      });
    }

    // Generate JWT
    const token = generateToken(user);

    // Remove password before sending user
    const { password: pwd, ...userData } = user.toObject();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userData
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  const token = req.body.tokenId || req.body.token || req.body.idToken;
  if (!token) return res.status(400).json({ message: "Google token required" });

  try {
    let info;

    // If token looks like a JWT (ID token), verify it
    if (typeof token === "string" && token.split(".").length === 3) {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      info = ticket.getPayload();
    } else {
      // Otherwise assume access token: fetch userinfo
      const r = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      info = r.data;
    }

    if (!info?.email) return res.status(400).json({ message: "No email from Google" });
    if (!info.email_verified) return res.status(400).json({ message: "Google email not verified" });

    const firstName = (info.given_name || (info.name || "").split(" ")[0] || "").trim() || "User";
    const lastName = (info.family_name || (info.name ? info.name.split(" ").slice(1).join(" ") : "") || "").trim();

    let user = await User.findOne({ email: info.email });
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email: info.email,
        isGoogleUser: true,
        password: null,
        isVerified: true,
        accountType: "performer", 
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const appToken = generateToken(user);
    const { password, ...safeUser } = user.toObject();

    res.status(200).json({ message: "Google auth OK", token: appToken, user: safeUser });
  } catch (err) {
    console.error("Google auth error:", err?.response?.data || err.message || err);
    res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
};