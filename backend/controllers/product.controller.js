import Product from "../models/product.model.js";
import {redis} from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({products});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
       let featuredProducts = await redis.get("featuredProducts"); 
       if(featuredProducts){
        return res.status(200).json(JSON.parse(featuredProducts));
       }
       featuredProducts = await Product.find({isFeatured: true}).lean();
       if(!featuredProducts){
        return res.status(404).json({ error: "Featured products not found" });
       }
       await redis.set("featuredProducts", JSON.stringify(featuredProducts));
       res.status(200).json({featuredProducts});
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryImage;
        if(image){
            cloudinaryImage = await cloudinary.uploader.upload(image,{folder:"products"});
        }
        const product = await Product.create(
            { name, 
            description, 
            price, 
            image: cloudinaryImage?.secure_url ? cloudinaryImage.secure_url: "" , 
            category });
            
        res.status(201).json({product});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product){
            return res.status(404).json({ error: "Product not found" });
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted successfully");
            } catch (error) {
                console.log(error);
            }
        }
        await product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    category: 1,
                }
            }
        ]);
        res.status(200).json({products});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.status(200).json({products});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({ error: "Product not found" });
        }
        product.isFeatured = !product.isFeatured;
        await product.save();
        await updateFeaturedProductsCache();
        res.status(200).json({ message: "Product featured status toggled successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateFeaturedProductsCache(){
    try {
        const featuredProducts = await Product.find({isFeatured: true}).lean();
        if(!featuredProducts){
            return res.status(404).json({ error: "Featured products not found" });
        }
        await redis.set("featuredProducts", JSON.stringify(featuredProducts));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}