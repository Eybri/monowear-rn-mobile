const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

exports.addToCart = async (req, res) => {
    try {
        const { productId, color, quantity, price } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock available for this product.' });
        }

        let cart = await Cart.findOne({ userId: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                userId: req.user._id,
                items: [{ productId, color, quantity, price }],
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.color === color);
            
            if (itemIndex !== -1) {
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].price = price; 
            } else {
                cart.items.push({ productId, color, quantity, price });
            }
        }

        await cart.save();
        return res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getCartCount = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });

        const cartItemCount = cart ? cart.items.length : 0;

        return res.status(200).json({
            cartItemCount,
            message: 'Cart count fetched successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// controllers/cartController.js
exports.getCartItems = async (req, res) => {
    try {
      const cart = await Cart.findOne({ userId: req.user._id })
        .populate('items.productId', 'images name price')
        .lean();
  
      if (!cart) return res.status(404).json({ message: 'Cart not found' });
  
      const cartItemsWithDetails = cart.items.map(item => ({
        product: item.productId, 
        quantity: item.quantity,
        color: item.color,
        price: item.price,  // Make sure to include the price
        id: item._id,
      }));
  
      return res.status(200).json({ items: cartItemsWithDetails });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
exports.updateQuantity = async (req, res) => {
    try {
        const { itemId, action } = req.body; 
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                cart.items.pull({ _id: itemId });
            }
        } else if (action === 'delete') {
            cart.items.pull({ _id: itemId });
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId }); 
            return res.status(200).json({ success: true, message: 'Cart is empty and has been deleted' });
        }

        await cart.save();

        return res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};










