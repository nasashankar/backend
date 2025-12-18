import mongoose from "mongoose";

const auditionSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  auditionType: {
    type: String,
    enum: ["open", "close", "online"],
    required: true,
  },
  poster:{
    data: Buffer,         // binary data
  contentType: String,  // e.g. "image/png"
  },
  mediaType: {
    type: String,
    enum: ["Movies", "TV_shows", "Web_series", "Short_films", "Music_videos"],
    required: true,
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true,
  },
  roleType: {
    type: String,
    enum: ["Main_Role", "Supporting_Role"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Any"],
    default: "Any",
  },
  ageRange: {
    type: Number,
    required: true ,
  },
  language: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  closingDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Audition = mongoose.model("Audition", auditionSchema);

export default Audition;