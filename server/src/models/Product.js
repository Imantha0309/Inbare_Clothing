import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Product name is required" },
            len: { args: [1, 200], msg: "Product name cannot exceed 200 characters" }
        }
    },
    slug: {
        type: DataTypes.STRING(250),
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Product description is required" },
            len: { args: [1, 2000], msg: "Description cannot exceed 2000 characters" }
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: "Price cannot be negative" }
        }
    },
    discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "Discount price cannot be negative" },
            isLessThanPrice(value) {
                if (value > 0 && value >= this.price) {
                    throw new Error('Discount price must be less than regular price');
                }
            }
        }
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }
    },
    colors: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    sizes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "Stock cannot be negative" }
        }
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    averageRating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "Rating cannot be less than 0" },
            max: { args: [5], msg: "Rating cannot exceed 5" }
        }
    },
    numReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    }
}, {
    tableName: 'products',
    timestamps: true,
    indexes: [
        { fields: ['categoryId'] },
        { fields: ['price'] },
        { fields: ['isFeatured'] },
        { fields: ['isActive'] },
        { fields: ['slug'] }
    ],
    hooks: {
        beforeSave: (product) => {
            if (product.changed('name')) {
                product.slug = product.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
            }
        }
    }
});

export default Product;
