import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Wishlist = sequelize.define('Wishlist', {
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
    products: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    }
}, {
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
        { fields: ['userId'], unique: true }
    ]
});

export default Wishlist;
