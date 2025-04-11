const express = require('express');
const router = express.Router();
const { createOrder,
        GetOrders,
        UpdateOrder,
        DeleteOrder,
        GetOrder,
        getTotalSalesStats
} = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware');
router.get('/admin/orders/delivered-stats', isAuthenticatedUser, authorizeRoles('admin'), getTotalSalesStats);
router.get('/orders', isAuthenticatedUser, GetOrder);
router.post('/orders/create', isAuthenticatedUser ,createOrder);
router.get('/admin/orders', isAuthenticatedUser, authorizeRoles('admin'), GetOrders);

router.put('/admin/orders/update', isAuthenticatedUser, UpdateOrder);
router.delete('/admin/orders/delete', isAuthenticatedUser, authorizeRoles('admin'), DeleteOrder);


module.exports = router;