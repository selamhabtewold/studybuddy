import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.mjs";
import userRoutes from "./routes/userRoutes.js"; // Import Routes
import courseRoutes  from './routes/courseRoutes.js';
import studyGroupRoutes  from './routes/studyGroupRoutes.js';


// Load environment variables
dotenv.config();

// Ensure MongoDB URI is set
if (!process.env.MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing in your .env file");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();




// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }));


app.options('*', cors());
  
app.use(express.json());


app.use("/api", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/study-groups", studyGroupRoutes);


// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
