import User from "../models/User.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { sendPasswordReset, sendWelcomeEmail } from "../utils/email.js";
import crypto from "crypto";
import { Op } from "sequelize";

export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
        });

        await sendWelcomeEmail(user);

        sendTokenResponse(user, 201, res, "Registration successful");
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password",
            });
        }

        const user = await User.findOne({
            where: { email },
            attributes: { include: ['password'] },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        sendTokenResponse(user, 200, res, "Login successful");
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        expires: new Date(0),
        path: "/",
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, street, city, state, zipCode, country } = req.body;

        const user = await User.findByPk(req.user.id);
        await user.update({ firstName, lastName, phone, street, city, state, zipCode, country });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide current and new password",
            });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { include: ['password'] },
        });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res, "Password updated successfully");
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found with this email",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        await sendPasswordReset(user, resetToken);

        res.status(200).json({
            success: true,
            message: "Password reset email sent",
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: Date.now() },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        sendTokenResponse(user, 200, res, "Password reset successful");
    } catch (error) {
        next(error);
    }
};
