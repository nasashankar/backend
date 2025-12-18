import User from '../Models/userModels.js';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';
import nodemailer from "nodemailer";
// -------------------- Multer Setup --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });
export const uploadMiddleware = upload.single("profilePic");

// -------------------- JWT Helper --------------------
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET_KEY || "your_jwt_secret",
    { expiresIn: '7d' }
  );
};

const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP config
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password
  },
  tls: {
    rejectUnauthorized: true, // keep security ON
  },
});

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
      // ✅ Password validation before hashing
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*])[A-Za-z\d!@#$%&*]{8,20}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      isGoogleUser: false,
      isVerified: false,
      otp,
      otpExpires,
    });

    await user.save();

    // ✅ Send OTP Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your account - OTP",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(201).json({
      message: "User registered successfully. Please verify your email with OTP.",
      userId: user._id,
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: "OTP verified successfully. Account activated.",
      token,
      user,
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- RESEND OTP --------------------

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // ✅ Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    user.otp = newOtp;
    user.otpExpires = otpExpires;
    await user.save();

    // ✅ Send OTP email again
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend OTP - Verify Your Account",
      text: `Your new OTP is ${newOtp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({
      message: "New OTP sent successfully to your email.",
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ message: "Server error" });
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

    if (user.isGoogleUser) {
      return res.status(400).json({ message: "Please login with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    const { password: pwd, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- Google Auth --------------------
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  const tokenId = req.body.tokenId || req.body.token;
  if (!tokenId) {
    return res.status(400).json({ message: "Google ID token is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email_verified, email, name } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Google email not verified" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        fullName: name,
        email,
        isGoogleUser: true,
        password: null
      });
      await user.save();
    }

    const token = generateToken(user);

    const { password: pwd, ...userData } = user.toObject();

    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: userData
    });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: "Google authentication failed: " + err.message });
  }
};

// -------------------- Get Profile --------------------
export const getProfile = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select("-password");
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = userDoc.toObject();

    // Convert profilePic Buffer → Base64 Data URL
    if (userObj.profilePic?.data) {
      userObj.profilePic = `data:${userObj.profilePic.contentType};base64,${userObj.profilePic.data.toString("base64")}`;
    } else {
      userObj.profilePic = null; // fallback when no pic
    }

    // ✅ Format dateOfBirth as YYYY-MM-DD
    if (userObj.dateOfBirth) {
      userObj.dateOfBirth = userObj.dateOfBirth.toISOString().split("T")[0];
    }

    res.json({ user: userObj });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ Update Profile ------------------
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      userName,
      email,
      gender,
      location,
      dateOfBirth,
      contactNumber,
      aboutMe,
      website,
      career,
      experience
    } = req.body;

    // multer file (if uploaded)
    const imgBuffer = req.file?.buffer;

    // 🔹 Find user by ID from auth middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Update fields only if provided
    if (fullName) user.fullName = fullName;
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (location) user.location = location;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (contactNumber) user.contactNumber = contactNumber;
    if (aboutMe) user.aboutMe = aboutMe;
    if (website) user.website = website;
    if (career) user.career = career;
    if (experience) user.experience = experience;

    // 🔹 Handle profile picture
    if (imgBuffer) {
      user.profilePic = {
        data: imgBuffer,
        contentType: req.file.mimetype,
      };
    }

    // 🔹 Save updates
    await user.save();

    // 🔹 Convert profilePic to Base64 for frontend
    const userObj = user.toObject();
    if (userObj.profilePic?.data) {
      userObj.profilePic = `data:${userObj.profilePic.contentType};base64,${userObj.profilePic.data.toString("base64")}`;
    }

    // 🔹 Exclude sensitive info
    const { password, otp, otpExpires, ...userData } = userObj;

    res.json({
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const errors = Object.keys(err.errors).map(
        (key) => err.errors[key].message
      );
      return res.status(400).json({ message: "Validation failed", errors });
    }

    res.status(500).json({ message: "Server error" });
  }
};


export const sendForgetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔗 Static reset password link
    const resetLink = `http://localhost:5173/forget-password`;

    // ✉️ Email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your app password
      },
    });

    // 📩 Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password Link",
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Here is your password reset link:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("Send Forget Password Link Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Forget Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};