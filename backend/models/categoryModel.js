const mongoose = require('mongoose');
const Product = require('./productModel'); 

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

categorySchema.pre('findOneAndDelete', async function (next) {
    const categoryId = this.getQuery()._id;
    await Product.deleteMany({ category: categoryId });
    next();
});

module.exports = mongoose.model('Category', categorySchema);
