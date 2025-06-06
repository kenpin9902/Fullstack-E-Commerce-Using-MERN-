import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if(!accessToken){
        return res.status(401).json({ message: "Unauthorized no access token" });
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const user = await User.findById(userId).select("-password");
        if(!user){
            return res.status(401).json({ message: "Unauthorized user not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized invalid access token" });
    }
}
    
export const adminRoute = (req, res, next) => {
    if(req.user.role !== "admin"){
        return res.status(401).json({ message: "Unauthorized admin access required" });
    }
    next();
}
