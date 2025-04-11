const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const sendEmail = require('../utils/sendEmail');

exports.createOrder = async (req, res) => {
    try {
        const { userId, paymentMethod, paymentDetails } = req.body;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart?.items?.length) return res.status(400).json({ message: "Your cart is empty. Please add items to your cart." });

        const user = await User.findById(userId).select('email shippingInfo');
        if (!user?.shippingInfo) return res.status(400).json({ message: "Shipping information is required." });

        const itemTotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        const totalPrice = itemTotal + 100;

        if (paymentMethod === 'creditcard' && (!paymentDetails?.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv)) {
            return res.status(400).json({ message: "Complete payment details are required for credit card payment method." });
        }

        await Promise.all(cart.items.map(async (item) => {
            const product = await Product.findById(item.productId._id);
            if (!product || product.stock < item.quantity) throw new Error(`Insufficient stock for product: ${product?.name || 'unknown'}`);
            product.stock -= item.quantity;
            await product.save();
        }));

        const savedOrder = await new Order({
            userId,
            products: cart.items.map(item => ({
                productId: item.productId._id,
                color: item.color,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice,
            paymentMethod,
            paymentDetails,
            shippingAddress: user.shippingInfo,
            status: 'Pending'
        }).save();

        await Cart.deleteOne({ userId });

        const emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h1 style="color: #2c3e50;">Order Confirmation - Avyhea Folk Co.</h1>
                <p>Thank you for your order, ${user?.email.split('@')[0]}!</p>
                <p>Your order has been placed successfully and is currently being processed.</p>
                
                <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
                
                <h3 style="color: #8e44ad;">Order Details:</h3>
                <ul style="padding-left: 20px;">
                    ${cart.items.map(item => `
                        <li style="margin-bottom: 15px;">
                            <strong>Product:</strong> ${item.productId.name} <br>
                            <strong>Quantity:</strong> ${item.quantity} <br>
                            <strong>Price:</strong> ₱${item.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} <br>
                            <strong>Shipping Fee:</strong> ₱100
                        </li>
                    `).join('')}
                </ul>
                
                <p><strong>Total Price:</strong> ₱${totalPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                
                <p style="font-style: italic; color: #8e44ad;">ˏˋ°•*⁀➷ We will notify you when your order is shipped. ˏˋ°•*⁀➷</p>
            </div>
        `;
        await sendEmail({
            email: user.email,
            subject: "Order Confirmation",
            message: emailContent
        });

        res.status(201).json({ message: "Order created successfully", order: savedOrder });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            message: error.message.includes("Insufficient stock") ? error.message : "An error occurred while creating the order."
        });
    }
};


exports.GetOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email') 
            .populate('products.productId', 'name price') 
            .sort({ createdAt: -1 }); 

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};


exports.UpdateOrder = async (req, res) => {
    try {
        const { orderId, status, note } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: 'Order ID and status are required.' });
        }

        const allowedStatuses = ['Delivered', 'Shipped', 'Cancelled', 'Pending'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const order = await Order.findById(orderId).populate('products.productId userId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (status === 'Cancelled' && !note) {
            return res.status(400).json({ success: false, message: 'Cancellation note required.' });
        }

        order.status = status;
        if (status === 'Cancelled') {
            order.note = note;

            for (const item of order.products) {
                const product = item.productId;
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        await order.save();

        if (status === 'Shipped' || status === 'Delivered') {
            const emailContent = `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h1 style="color: #2c3e50;">Order Status Update - Avyhea Folk Co.</h1>
                    <p>Dear ${order.userId.email.split('@')[0]},</p>
                    <p>Your order with ID <strong>${order._id}</strong> has been updated to: <strong>${status}</strong> on <strong>${new Date().toLocaleDateString()}</strong>.</p>
                    
                    <h3 style="color: #8e44ad;">Order Details:</h3>
                    <ul style="padding-left: 20px;">
                        ${order.products.map(item => `
                            <li style="margin-bottom: 15px;">
                                <strong>Product:</strong> ${item.productId.name} <br>
                                <strong>Quantity:</strong> ${item.quantity} <br>
                                <strong>Price:</strong> ₱${item.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} <br>
                                <strong>Shipping Fee:</strong> ₱100
                            </li>
                        `).join('')}
                    </ul>
                    
                    <p style="font-style: italic; color: #8e44ad;">ˏˋ°•*⁀➷ Thank you for shopping with us! ˏˋ°•*⁀➷</p>
                </div>
            `;

            await sendEmail({
                email: order.userId.email,
                subject: `Your Order Status: ${status}`,
                message: emailContent
            });
        }

        res.status(200).json({ success: true, message: 'Order updated successfully.', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};





exports.DeleteOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required.' });
        }
        const order = await Order.findByIdAndDelete(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        res.status(200).json({ success: true, message: 'Order deleted successfully.' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.GetOrder = async (req, res, next) => {
    try {
        const userId = req.user._id; 

        const orders = await Order.find({ userId })
            .populate('products.productId', 'name price images') 
            .sort({ createdAt: -1 }); 

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'No orders found for this user' });
        }

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTotalSalesStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Convert startDate and endDate to Date objects if they exist
        const matchStage = {
            $match: {
                status: 'Delivered',
            },
        };

        if (startDate && endDate) {
            matchStage.$match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const totalSales = await Order.aggregate([
            matchStage,
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$createdAt"
                        }
                    },
                    totalSales: {
                        $sum: "$totalPrice"
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        if (totalSales.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No sales data found.",
                data: []
            });
        }

        const salesData = totalSales.map(sale => ({
            date: sale._id,
            totalSales: sale.totalSales
        }));

        res.status(200).json({
            success: true,
            salesData
        });
    } catch (error) {
        console.error("Error fetching total sales stats:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching total sales stats',
            error: error.message
        });
    }
};




