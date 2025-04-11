const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const cloudinary = require('cloudinary');

exports.newProduct = async (req, res, next) => {
    try {
        let imagesLinks = [];
        
        // Only process images if they exist in the request
        if (req.body.images && req.body.images.length > 0) {
            let images = [];
            if (typeof req.body.images === 'string') {
                images.push(req.body.images);
            } else {
                images = req.body.images;
            }

            for (let i = 0; i < images.length; i++) {
                try {
                    const result = await cloudinary.v2.uploader.upload(images[i], {
                        folder: 'products',
                        width: 150,
                        crop: "scale",
                    });
                    imagesLinks.push({
                        public_id: result.public_id,
                        url: result.secure_url,
                    });
                } catch (uploadError) {
                    console.error('Cloudinary Upload Error:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Image upload failed',
                    });
                }
            }
        }

        req.body.images = imagesLinks; // Will be empty if no images provided
        req.body.user = req.user.id;

        const categoryExists = await Category.findById(req.body.category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Category not found',
            });
        }

        const product = await Product.create(req.body);

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Product not created',
            });
        }

        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error('Product Creation Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
const APILayout = require('../utils/apiLayout');
exports.getProducts = async (req, res, next) => {
    try {
      const resPerPage = 8;
      const page = Number(req.query.page) || 1;
  
      // Base query with population
      const baseQuery = Product.find().populate('category', 'name');
      
      // Build query object for filters
      const queryObj = { ...req.query };
  
      // Remove special fields from query
      const removeFields = ['page'];
      removeFields.forEach(param => delete queryObj[param]);
  
      // Convert query object to string for manipulation
      let queryStr = JSON.stringify(queryObj);
  
      // Add $ to operators (gte, lte, etc)
      queryStr = queryStr.replace(/\b(gte|lte)\b/g, match => `$${match}`);
  
      // Parse back to object
      const parsedQuery = JSON.parse(queryStr);
  
      // Create the API layout instance
      const apiQuery = new APILayout(baseQuery, parsedQuery)
        .categoryFilter()
        .priceFilter()
        .ratingFilter()
        .pagination(resPerPage);
  
      const products = await apiQuery.query;
      const productsCount = await Product.countDocuments();
      const filteredProductsCount = products.length;
  
      res.status(200).json({
        success: true,
        filteredProductsCount,
        productsCount,
        products,
        resPerPage,
      });
    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({ 
        success: false, 
        message: 'Server Error',
        error: error.message 
      });
    }
  };


exports.getAdminProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('category', 'name'); // Populate category with its name
        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve products',
            error: error.message
        });
    }
};


exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if images should be handled
        const shouldHandleImages = req.body.images || req.body.existingImages || req.body.clearImages;
        
        if (shouldHandleImages) {
            let newImagesLinks = [];

            // Handle case where we want to clear all images
            if (req.body.clearImages) {
                // Delete all existing images from Cloudinary
                for (let image of product.images) {
                    if (image.public_id) {
                        await cloudinary.v2.uploader.destroy(image.public_id);
                    }
                }
            }
            // Handle case where we need to upload new images
            else if (req.body.images && req.body.images.length > 0) {
                // Delete old images from Cloudinary
                for (let image of product.images) {
                    if (image.public_id) {
                        await cloudinary.v2.uploader.destroy(image.public_id);
                    }
                }
                
                // Upload new images
                for (let imageData of req.body.images) {
                    // For base64 encoded images from mobile
                    if (imageData.startsWith('data:image')) {
                        const result = await cloudinary.v2.uploader.upload(imageData, {
                            folder: 'products',
                            width: 150,
                            crop: 'scale',
                        });
                        
                        newImagesLinks.push({
                            public_id: result.public_id,
                            url: result.secure_url
                        });
                    }
                }
                req.body.images = newImagesLinks;
            }
            // Handle case with existing images (some were removed)
            else if (req.body.existingImages && req.body.existingImages.length > 0) {
                // Find which images were removed
                const existingImageIds = req.body.existingImages.map(img => img.public_id);
                
                // Delete removed images from Cloudinary
                for (let image of product.images) {
                    if (image.public_id && !existingImageIds.includes(image.public_id)) {
                        await cloudinary.v2.uploader.destroy(image.public_id);
                    }
                }
                
                req.body.images = req.body.existingImages;
            }
        } else {
            // If images aren't being updated, keep the existing ones
            delete req.body.images;
        }
        
        // Remove temporary fields we don't want to save to DB
        delete req.body.existingImages;
        delete req.body.clearImages;

        // Update the product
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error updating product:', error); 
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
};


exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name') 
            .populate({
                path: 'reviews',
                populate: { 
                    path: 'user', 
                    select: 'name email avatar' 
                },
                select: 'rating comment images',
            })
            .populate({
                path: 'reviews',
                populate: {
                    path: 'order',
                    select: 'products',
                    populate: {
                        path: 'products.productId',
                        match: { _id: req.params.id },
                        select: 'color'
                    }
                }
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};


const Review = require('../models/reviewModel'); 

const Order = require('../models/orderModel'); 
const Cart = require('../models/cartModel')
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Delete product images from Cloudinary
        for (let image of product.images) {
            await cloudinary.v2.uploader.destroy(image.public_id);
        }

        // Delete all reviews associated with the product
        await Review.deleteMany({ _id: { $in: product.reviews } });

        // Remove the product from any orders
        await Order.updateMany(
            { "products.productId": req.params.id },
            { $pull: { products: { productId: req.params.id } } }
        );

        // Remove the product from all carts
        await Cart.updateMany(
            { "items.productId": req.params.id },
            { $pull: { items: { productId: req.params.id } } }
        );

        // Optional: Delete orders that are now empty after product removal
        await Order.deleteMany({ products: { $size: 0 } });

        // Optional: Delete carts that are now empty after product removal
        await Cart.deleteMany({ items: { $size: 0 } });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully. Associated reviews removed, product references cleared from orders and carts.',
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message,
        });
    }
};