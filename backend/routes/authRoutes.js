const express = require('express');
const upload = require("../utils/multer");
const router = express.Router();
const { registerUser, 
    loginUser, 
    forgotPassword, 
    logoutUser, 
    resetPassword,
    updatePassword,
    updateProfile,
    getUserProfile,
    addShipping,
    showUsers,
    deleteUser,
    getUserDetails,
    updateUserDetails,
    checkUserExists

} = require('../controllers/authController');
const { isAuthenticatedUser } = require('../middlewares/authMiddleware');

// Register user
router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);

router.post('/logout', logoutUser);
router.post('/check-user', checkUserExists);
router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, upload.single("avatar"), updatePassword)

router.put('/me/shipping', isAuthenticatedUser,addShipping)

router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.get('/admin/users',  showUsers)
router.route('/admin/user/:id').delete(isAuthenticatedUser, deleteUser).get(isAuthenticatedUser, getUserDetails).put(isAuthenticatedUser, updateUserDetails)

module.exports = router;
