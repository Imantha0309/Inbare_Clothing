import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../config/database.js";

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "First name is required" },
            len: { args: [1, 50], msg: "First name cannot exceed 50 characters" }
        }
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Last name is required" },
            len: { args: [1, 50], msg: "Last name cannot exceed 50 characters" }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: "Please enter a valid email" }
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: { args: [6, 255], msg: "Password must be at least 6 characters" }
        }
    },
    role: {
        type: DataTypes.ENUM('customer', 'admin'),
        defaultValue: 'customer'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    street: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    zipCode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        defaultValue: 'Sri Lanka'
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    },
    address: {
        type: DataTypes.VIRTUAL,
        get() {
            return {
                street: this.street,
                city: this.city,
                state: this.state,
                zipCode: this.zipCode,
                country: this.country,
            };
        }
    }
}, {
    tableName: 'users',
    timestamps: true,
    defaultAttributes: {
        exclude: ['password'],
    },
    indexes: [
        { fields: ['email'] },
        { fields: ['role'] }
    ],
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
