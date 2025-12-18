import Audition from "../Models/auditionModels.js";
import multer from "multer";


const storage = multer.memoryStorage(); // store in memory as Buffer
const upload = multer({ storage });

export const uploadMiddleware = upload.single("poster"); // field name 'poster'


// ---------------- CREATE AUDITION ----------------
export const createAudition = async (req, res) => {
  try {
    const {
      userId,
      auditionType,
      mediaType,
      projectTitle,
      roleType,
      gender,
      ageRange,
      language,
      location,
      description,
      closingDate,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const newAudition = new Audition({
      userId, // associate audition with user
      auditionType,
      mediaType,
      projectTitle,
      roleType,
      gender,
      ageRange: JSON.parse(ageRange), // parse if sent as string
      language,
      location,
      description,
      closingDate,
    });

    // Poster upload
    if (req.file) {
      newAudition.poster.data = req.file.buffer;
      newAudition.poster.contentType = req.file.mimetype;
    }

    const savedAudition = await newAudition.save();
    res.status(201).json(savedAudition);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const getAllAuditions = async (req, res) => {
  try {
    const auditions = await Audition.find();
    res.status(200).json(auditions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ GET SINGLE AUDITION BY ID
export const getAuditionById = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ message: "Audition not found" });
    res.status(200).json(audition);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 🧑 GET AUDITIONS BY USER ID
export const getAuditionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const auditions = await Audition.find({ userId });

    if (!auditions || auditions.length === 0) {
      return res.status(404).json({ message: "No auditions found for this user" });
    }

    res.status(200).json(auditions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✏️ UPDATE AUDITION (with optional poster)
export const updateAudition = async (req, res) => {
  try {
    const data = req.body;

    if (req.file) {
      data.poster = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    if (data.ageRange) {
      data.ageRange = JSON.parse(data.ageRange);
    }

    const updatedAudition = await Audition.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );

    if (!updatedAudition) return res.status(404).json({ message: "Audition not found" });

    res.status(200).json(updatedAudition);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 🗑️ DELETE AUDITION
export const deleteAudition = async (req, res) => {
  try {
    const audition = await Audition.findByIdAndDelete(req.params.id);
    if (!audition) return res.status(404).json({ message: "Audition not found" });
    res.status(200).json({ message: "Audition deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};