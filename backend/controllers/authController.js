const User = require('../models/userModel');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('cloudinary');
const crypto = require('crypto')

exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an avatar image'
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        });

        const user = await User.create({
            name,
            email,
            password,
            role,
            avatar: {
                public_id: result.public_id,
                url: result.secure_url
            }
        });

        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email & password' })
    }

    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    const isPasswordMatched = await user.comparePassword(password);


    if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }

    sendToken(user, 200, res)
}

exports.logoutUser = (req, res) => {
    res.status(200).json({ message: 'User logged out' });
};

exports.checkUserExists = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            return res.status(200).json({ exists: true });
        }
        return res.status(200).json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};


exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${req.protocol}://localhost:3000/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'Avyhea Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            token: `${resetToken}`,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })
    }
}

exports.resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);
}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
        success: true,
        user,
    });
};

exports.updatePassword = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('password');
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    sendToken(user, 200, res)

}

exports.addShipping = async (req, res, next) => {
    const { address, city, phoneNo, postalCode, country } = req.body;

    try {
        const user = await User.findById(req.user.id); 

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.shippingInfo = {
            address,
            city,
            phoneNo,
            postalCode,
            country
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Shipping information added successfully',
            shippingInfo: user.shippingInfo 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error adding shipping information',
            error: error.message 
        });
    }
};



exports.updateProfile = async (req, res, next) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email
        }

        if (req.file) {  // Changed from req.body.avatar to req.file
            const user = await User.findById(req.user.id);

            // Delete old avatar if exists
            if (user.avatar?.public_id) {
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }

            // Upload new avatar
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            });

            newUserData.avatar = {
                public_id: result.public_id,
                url: result.secure_url
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User Not Updated' 
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error',
            error: error.message 
        });
    }
}
exports.showUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updateUserDetails = async (req, res, next) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            shippingInfo: { 
                address: req.body.address,
                city: req.body.city,
                phoneNo: req.body.phoneNo,
                postalCode: req.body.postalCode,
                country: req.body.country
            }
        };

        const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user 
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
    }

    res.status(200).json({
        success: true,
        user
    })
}


