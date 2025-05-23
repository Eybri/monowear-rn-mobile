const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        color: {
            type: String,
            required: true
          },
        price: {
            type: Number,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cashondelivery', 'creditcard'],
        required: true
    },
    paymentDetails: {
        cardNumber: {
            type: String,
            required: function() { return this.paymentMethod === 'creditcard'; },
            // minlength: 13,
            // maxlength: 16
        },
        expiryDate: {
            type: String,
            required: function() { return this.paymentMethod === 'creditcard'; }
        },
        cvv: {
            type: String,
            required: function() { return this.paymentMethod === 'creditcard'; },
            // minlength: 3,
            // maxlength: 3
        }
    },
    shippingAddress: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled','Completed'],
        default: 'pending'
    },
    note: {
        type: String,
        required: function() {
            return this.status === 'Cancelled'; 
        },
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

}, {
    timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);
