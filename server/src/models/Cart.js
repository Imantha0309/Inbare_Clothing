import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
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
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "Total cannot be negative" }
        }
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    }
}, {
    tableName: 'carts',
    timestamps: true,
    indexes: [
        { fields: ['userId'], unique: true }
    ],
    hooks: {
        beforeSave: (cart) => {
            if (cart.items && Array.isArray(cart.items)) {
                cart.totalAmount = cart.items.reduce(
                    (total, item) => total + (item.price * item.quantity),
                    0
                );
            }
        }
    }
});

export default Cart;
