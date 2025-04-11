const express = require('express');
const router = express.Router();
// const upload = require('../utils/multer')
const { newCategory,
        getAdminCategory,
        deleteCategory,
        updateCategory,
        getCategoryStock
} = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/admin/category/new', isAuthenticatedUser, authorizeRoles('admin'), newCategory)
router.get('/admin/categories', isAuthenticatedUser, authorizeRoles('admin'), getAdminCategory);
// router.route('/admin/category/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);
router
    .route('/admin/category/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateCategory)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);
router.get('/admin/category-stock', isAuthenticatedUser, authorizeRoles('admin'), getCategoryStock);
module.exports = router;