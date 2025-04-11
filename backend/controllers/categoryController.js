const Category = require('../models/categoryModel'); 
const Product = require('../models/productModel'); 

exports.newCategory = async (req, res, next) => {
	
	req.body.user = req.user.id;
	const category = await Category.create(req.body);
	res.status(201).json({
		success: true,
		category
	})
}

exports.deleteCategory = async (req, res, next) => {
	const category = await Category.findByIdAndDelete(req.params.id);
	if (!category) {
		return res.status(404).json({
			success: false,
			message: 'Category not found'
		})
	}
	res.status(200).json({
		success: true,
		message: 'Category deleted'
	})
}


exports.getAdminCategory = async (req, res, next) => {
    try {
        const category = await Category.find();
        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve category',
            error: error.message
        });
    }
}

exports.updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            category: updatedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
};

exports.getCategoryStock = async (req, res, next) => {
    try {
        const categories = await Category.find();
        const stockData = await Promise.all(
            categories.map(async (category) => {
                const products = await Product.find({ category: category._id });
                const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
                return {
                    category: category.name,
                    stock: totalStock
                };
            })
        );


        res.status(200).json({
            success: true,
            stockData
        });
    } catch (error) {
        console.error('Error fetching category stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category stock',
            error: error.message
        });
    }
};

