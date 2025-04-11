// models/Cart.js
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', 
          required: true
        },
        color: { 
          type: String, 
          required: true 
        },
        quantity: { 
          type: Number, 
          default: 1, 
          min: 1 
        },
        price: { 
          type: Number, 
          required: true 
        },
      }
    ],
  },
  { timestamps: true }
);


module.exports = mongoose.model('Cart', CartSchema);

// CartSchema.pre('save', function (next) {
//   // Only include items where isSelected is true
//   this.totalPrice = this.items
//     .filter(item => item.isSelected)
//     .reduce((total, item) => total + item.price * item.quantity, 0);
//   next();
// });