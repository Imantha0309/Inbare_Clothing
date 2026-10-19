import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    street: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    zipCode: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Sri Lanka'
    },
    paymentMethod: {
        type: DataTypes.ENUM('cod', 'card', 'bank_transfer'),
        allowNull: false,
        defaultValue: 'cod'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    orderStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: "Total cannot be negative" }
        }
    },
    shippingCost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    note: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: "Note cannot exceed 500 characters" }
        }
    },
    couponCode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "Discount cannot be negative" }
        }
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    }
}, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'createdAt'] },
        { fields: ['orderStatus'] },
        { fields: ['paymentStatus'] }
    ]
});

export default Order;
