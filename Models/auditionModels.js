import mongoose from "mongoose";

// const auditionSchema = new mongoose.Schema({
//     userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//    projectTitle: { type: String, required: true },
//     productionCompany: { type: String, required: true },
//     category: {
//       type: String,
//       enum: ["Acting", "Modeling", "Voice Acting", "Music"],
//       required: true,
//     },
//   mediaType: { type: String, 
//     enum: [
//     "Movie","TV Series", "Commercial","Fashion Show","Musical Theater", "Web Series",
//   ],
//     required: true },
//   auditionType: { type: String, 
//      enum: ["Open", "Selective", "Remote", "Live", "Callback"],required: true },
//  directorName: { type: String, required: true },
//   // Role Requirements
//     roleName: { type: String, required: true },
//     gender: {
//       type: String,
//       enum: ["Male", "Female", "Any"],
//       required: true,
//     },
//     ageRange: { type: String, required: true },
//     language: { type: String, required: true },
//     skills: { type: String, required: true },
//     experienceLevel: {
//       type: String,
//       enum: ["Beginner", "Intermediate", "Professional"],
//       required: true,
//     },
//     roleDescription: { type: String, required: true },

//     // Location & Schedule
//     shootLocation: { type: String, required: true },
//     auditionLocation: { type: String, required: true },
//     shootDates: { type: String, required: true },
//     auditionDate: { type: Date, required: true },
//     auditionTime: { type: String, required: true },
//     applicationDeadline: { type: Date, required: true },

//     // Contact & Compensation
//     contactName: { type: String, required: true },
//     contactNumber: { type: String, required: true },
//     contactEmail: {
//   type: String,
//   required: true,
//   lowercase: true,
//   match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
// },
//     compensation: { type: String, required: true },
  
// },
// { timestamps: true }
// );

const auditionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectTitle: { type: String, required: true },
    productionCompany: { type: String, required: true },

    category: {
      type: String,
      enum: ["Acting", "Modeling", "Voice Acting", "Music"],
      required: true,
    },

    mediaType: {
      type: String,
      enum: [
        "Movie",
        "TV Series",
        "Commercial",
        "Fashion Show",
        "Musical Theater",
        "Web Series",
      ],
      required: true,
    },

    auditionType: {
      type: String,
      enum: ["Open", "Selective", "Remote", "Live", "Callback"],
      required: true,
    },

    directorName: { type: String, required: true },

    roleName: { type: String, required: true },

    gender: {
      type: String,
      enum: ["Male", "Female", "Any"],
      required: true,
    },

    ageRange: { type: String, required: true },
    language: { type: String, required: true },
   skills: {
  type: [String],
  required: true,
  validate: {
    validator: (v) => Array.isArray(v) && v.length > 0,
    message: "At least one skill is required",
  },
},


    experienceLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Professional"],
      required: true,
    },

    roleDescription: { type: String, required: true },

    shootLocation: { type: String, required: true },
    auditionLocation: { type: String, required: true },
    shootDates: { type: String, required: true },

    auditionDate: { type: Date, required: true },
    auditionTime: { type: String, required: true },
    applicationDeadline: { type: Date, required: true },

    contactName: { type: String, required: true },
    contactNumber: { type: String, required: true },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
    },

    compensation: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);


const Audition = mongoose.model("Audition", auditionSchema);

export default Audition;