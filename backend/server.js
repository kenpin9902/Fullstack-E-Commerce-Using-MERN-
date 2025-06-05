import express from "express";
import { connectDB } from "./lib/db.js";
import dotenv from "dotenv";
import AuthRoute from "./routes/Auth.route.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", AuthRoute);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
