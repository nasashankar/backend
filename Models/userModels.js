
// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: [true, "Full name is required"],
//     trim: true,
//     maxlength: [100, "Full name must be at most 100 characters"],
//   },
//   email: {
//     type: String,
//     required: [true, "Email is required"],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     maxlength: [254, "Email must be at most 254 characters"],
//     match: [
//       /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
//       "Please enter a valid email address",
//     ],
//   },
//   password: {
//     type: String,
//     minlength: [8, "Password must be at least 8 characters"],
//     required: function () {
//       // Password is required only if NOT a Google user
//       return !this.isGoogleUser;
//     },
//   },
//   isGoogleUser: {
//     type: Boolean,
//     default: false,
//   },

//   // 🔹 Dashboard/Profile fields
//   gender: {
//     type: String,
//     enum: ["Male", "Female", "Other"], // optional restriction
//   },
//   location: {
//     type: String,
//     trim: true,
//     maxlength: [200, "Location must be at most 200 characters"],
//   },
//   dateOfBirth: {
//     type: Date,
//   },
//   contactNumber: {
//     type: String,
//     match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
//   },

//   profilePic: {
//   data: Buffer,         // binary data
//   contentType: String,  // e.g. "image/png"
// },
//   aboutMe: {
//     type: String,
//     maxlength: [500, "About Me must be at most 500 characters"],
//   },
//   isVerified: { type: Boolean, default: false },  // 👈 new
//   otp: { type: String },                          // 👈 new
//   otpExpires: { type: Date },   
//    userName: {
//     type: String,
//     trim: true,
//     maxlength: [100, "Username must be at most 100 characters"],
//   },
//    website: {
//       type: String,
//       trim: true,
//     },
//     career: {
//       type: String,
//       trim: true,
//     },
//      experience: {
//       type: String, 
//       trim: true,
//     },
// }, { timestamps: true });

// const User = mongoose.model("User", userSchema);

// export default User;


import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "firstName is required"],
      trim: true,
      maxlength: [100, "firstName must be at most 100 characters"],
    },

    lastName: {
      type: String,
      required: [true, "lastName is required"],
      trim: true,
      maxlength: [100, "lastName must be at most 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email must be at most 254 characters"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      required: function () {
        return !this.isGoogleUser;
      },
    },

    isGoogleUser: {
      type: Boolean,
      default: false,
    },
     isVerified: { type: Boolean, default: false },  // 👈 new
   otp: { type: String },                          // 👈 new
   otpExpires: { type: Date },   
    userName: {
     type: String,
     trim: true,
     maxlength: [100, "Username must be at most 100 characters"],
   },

    // ⭐ IMPORTANT (Frontend requires this)
    accountType: {
      type: String,
      enum: ["performer", "casting-director", "agent", "producer"],
      required: [true, "Account type is required"],
    },

    // Optional newsletter subscription
    newsletter: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;