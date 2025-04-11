const express = require('express');
const router = express.Router();
const { addToCart, 
        getCartCount,
        getCartItems,
        updateQuantity,
        // decreaseQuantity
} = require('../controllers/cartController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/cart/add',isAuthenticatedUser, addToCart);
router.get('/cart/count',isAuthenticatedUser, getCartCount);
router.get('/cart/items',isAuthenticatedUser, getCartItems);

router.put('/cart/update', isAuthenticatedUser, updateQuantity);
// router.put('/cart/decrease', isAuthenticatedUser, decreaseQuantity);

module.exports = router;