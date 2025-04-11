const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware');
const {getAdminProducts,
        newProduct,
        deleteProduct,
        updateProduct,
        getProduct,
        getProducts
} = require('../controllers/productController');
router.get('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.post('/admin/product/new', isAuthenticatedUser, authorizeRoles('admin',), upload.array('images', 10), newProduct);

router.get('/products', getProducts)
router.get('/product/:id', getProduct) 
router.route('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin',)).put(upload.array('images', 10), updateProduct)
router.route('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin',)).delete(deleteProduct);


module.exports = router;