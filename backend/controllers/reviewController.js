const Review = require('../models/reviewModel');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/productModel');
// const Order = require('../models/orderModel')
const BadWords = require('bad-words');
const filter = new BadWords();

filter.addWords('tangina', 'bullshit', 'gago', 'putangina', 'yabang', 'puchaaaaa', 'bobo', 'shit', 'tanga', 'ulol', 'pakyu', 'kupal', 'pota');
const preComment = comment => comment.replace(/[.,!?;()&%$#@]/g, '').toLowerCase();

exports.addReview = async (req, res) => {
    try {
        const { productId, rating, comment, orderId } = req.body;
        
        if (!productId || !rating || !comment || !orderId) 
            return res.status(400).json({ message: 'All fields are required, including order ID.' });

        // Find the order to verify the product exists in the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check if product exists in the order
        const productInOrder = order.products.some(product => 
            product.productId.toString() === productId.toString()
        );

        if (!productInOrder) {
            return res.status(400).json({ message: 'This product is not in the specified order.' });
        }

        // Check if review already exists for this specific product and order
        const existingReview = await Review.findOne({ 
            product: productId, 
            user: req.user._id, 
            order: orderId 
        });
        
        if (existingReview) 
            return res.status(400).json({ message: 'You have already reviewed this product for this order.' });

        const filteredComment = filter.clean(preComment(comment));

        const review = await new Review({
            user: req.user._id,
            product: productId,
            order: orderId,
            rating,
            comment: filteredComment,
            images: [] // No images in this version
        }).save();

        // Update product's average rating if needed
        await updateProductRating(productId);
        
        res.status(201).json({ message: 'Review added successfully!', review });
    } catch (error) {
        console.error('Error adding review:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Helper function to update product rating
async function updateProductRating(productId) {
    try {
        const reviews = await Review.find({ product: productId });
        
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            await Product.findByIdAndUpdate(productId, {
                rating: averageRating,
                numReviews: reviews.length
            });
        }
    } catch (error) {
        console.error('Error updating product rating:', error);
    }
}
exports.getUserReviews = async (req, res) => {
    try {
        const user = req.user._id; 
        const reviews = await Review.find({ user: user })
        .populate({
            path: 'product',
            select: 'name description price images',
        })
        .populate({
            path: 'order',
            populate: {
                path: 'products.productId',
                select: 'color',
            },
        })
        .exec();

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this user.' });
        }

        res.status(200).json({ message: 'Reviews fetched successfully!', reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate({
                path: 'user',
                select: 'name email avatar',
            })
            .populate({
                path: 'product',
                select: 'name description price images',
            })
            .populate({
                path: 'order',
                select: '_id products', 
                populate: {
                    path: 'products.productId',
                    select: 'color', 
                },
            })
            .exec();

        res.status(200).json({ message: 'All reviews fetched successfully!', reviews });
    } catch (error) {
        console.error('Error fetching all reviews:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};


exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params; 
        const { rating, comment, images } = req.body; 

        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required.' });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        const cleanedComment = filter.clean(comment);  
        
        review.rating = rating;
        review.comment = cleanedComment;  

        if (images && images.length > 0) {
            for (let img of review.images) {
                await cloudinary.uploader.destroy(img.public_id);
            }

            const uploadedImages = await Promise.all(images.map(async (img) => {
                const uploadResult = await cloudinary.uploader.upload(img, {
                    folder: 'reviews', 
                });
                return {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }));

            review.images = uploadedImages;
        }

        await review.save();

        res.status(200).json({ message: 'Review updated successfully', review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the review.' });
    }
};


exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        const product = await Product.findById(review.product);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const reviewIndex = product.reviews.indexOf(reviewId);
        if (reviewIndex !== -1) {
            product.reviews.splice(reviewIndex, 1);
        }

        const totalReviews = product.reviews.length;
        let newAverageRating = 5;  // Default rating when no reviews exist

        if (totalReviews > 0) {
            const reviews = await Review.find({ '_id': { $in: product.reviews } });

            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);

            newAverageRating = totalRating / totalReviews;
        }

        product.numReviews = totalReviews;
        product.averageRating = parseFloat(newAverageRating.toFixed(1)); 

        await product.save();

        for (let img of review.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }

        await review.deleteOne();

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while deleting the review.' });
    }
};


