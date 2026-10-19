import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Product from "./Product.js";

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }
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
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: "Rating must be at least 1" },
            max: { args: [5], msg: "Rating cannot exceed 5" }
        }
    },
    comment: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: "Comment cannot exceed 1000 characters" }
        }
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() { return this.id; }
    }
}, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
        { fields: ['productId', 'userId'], unique: true },
        { fields: ['productId', 'createdAt'] }
    ]
});

// Static method to calculate average rating
Review.calcAverageRating = async function (productId) {
    const result = await Review.findAll({
        where: { productId },
        attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'numReviews']
        ],
        raw: true
    });

    if (result && result[0]) {
        const avgRating = parseFloat(result[0].averageRating) || 0;
        const numReviews = parseInt(result[0].numReviews) || 0;
        
        await Product.update(
            {
                averageRating: Math.round(avgRating * 10) / 10,
                numReviews: numReviews
            },
            { where: { id: productId } }
        );
    } else {
        await Product.update(
            { averageRating: 0, numReviews: 0 },
            { where: { id: productId } }
        );
    }
};

// Hook to update product rating after save
Review.addHook('afterCreate', async (review) => {
    await Review.calcAverageRating(review.productId);
});

Review.addHook('afterUpdate', async (review) => {
    await Review.calcAverageRating(review.productId);
});

Review.addHook('afterDestroy', async (review) => {
    await Review.calcAverageRating(review.productId);
});

export default Review;
