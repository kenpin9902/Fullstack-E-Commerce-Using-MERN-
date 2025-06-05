import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}

const storeRefreshToken = async(userId, refreshToken) => {
    await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
}

const setCookie = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exisUser = await User.findOne({ email });
        if(exisUser){
            return res.status(400).json({ error: "User already exists" });
        }
        else{
            const user = await User.create({ name, email, password });

            const {accessToken, refreshToken} = generateToken(user._id);
            await storeRefreshToken(user._id, refreshToken);

            setCookie(res, accessToken, refreshToken);

            res.status(201).json({ user,message:"User created successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET).userId;
        await redis.del(`refreshToken:${userId}`);
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if(user && await user.comparePassword(password)){
            const {accessToken, refreshToken} = generateToken(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookie(res, accessToken, refreshToken);
            res.status(200).json({ user, message: "User logged in successfully" });
        }
        else{
            return res.status(401).json({ error: "password or email is incorrect" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken1 = req.cookies.refreshToken;
        if(!refreshToken1){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = jwt.
        verify(refreshToken1, process.env.REFRESH_TOKEN_SECRET).userId;
        const storedRefreshToken = await redis.get(`refreshToken:${userId}`);
        if(!storedRefreshToken || storedRefreshToken !== refreshToken1){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });
        res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
