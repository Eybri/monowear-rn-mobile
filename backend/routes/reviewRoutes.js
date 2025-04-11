const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware');
const {addReview,
    getUserReviews,
    updateReview,
    deleteReview,
    getAllReviews
} = require('../controllers/reviewController');
router.get('/admin/reviews/all', isAuthenticatedUser, authorizeRoles('admin'), getAllReviews);
router.post('/reviews', isAuthenticatedUser, addReview);
router.get('/reviews/all', isAuthenticatedUser, getUserReviews);
router.put('/reviews/:reviewId', upload.array('images', 5), isAuthenticatedUser, updateReview);
router.delete('/reviews/:reviewId', deleteReview);
module.exports = router;