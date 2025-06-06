import express from "express";
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getProductsByCategory, getRecommendedProducts, toggleFeaturedProduct } from "../controllers/product.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",protectRoute,adminRoute, getAllProducts);
router.get("/Featured",getFeaturedProducts);
router.get("/category/:category",getProductsByCategory);
router.get("/recommended",getRecommendedProducts);
router.post("/",protectRoute,adminRoute, createProduct);
router.patch("/:id",protectRoute,adminRoute, toggleFeaturedProduct);
router.delete("/:id",protectRoute,adminRoute, deleteProduct);

export default router;
