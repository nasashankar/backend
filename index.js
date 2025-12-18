import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import connectDB from './Database/config.js';
import userRouter from "./Routers/userRouters.js"
import auditionRouter from "./Routers/auditionRouter.js"

dotenv.config()

const app = express()


const allowedOrigins = [
  "http://localhost:3000",
  "https://test.nasaadigitalmedia.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // IMPORTANT (cookies / auth)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

    app.use(express.json());

    app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  });

  connectDB();

  app.use('/api/user/',userRouter);
  app.use("/api/",auditionRouter)

     app.get("/", (req, res) => {
    res.send("Welcome to the api");
  });


  app.listen(process.env.PORT, () => {
    console.log("Server is running on port");
  });