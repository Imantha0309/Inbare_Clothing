import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { Op } from "sequelize";
import { deleteFile } from "../utils/gridfs.js";

export const getProducts = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            minPrice,
            maxPrice,
            search,
            featured,
            sort = "-createdAt",
            all = "false",
        } = req.query;

        const where = {};

        if (all !== "true") {
            where.isActive = true;
        }

        if (category) where.categoryId = category;
        if (featured === "true") where.isFeatured = true;
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = Number(minPrice);
            if (maxPrice) where.price[Op.lte] = Number(maxPrice);
        }
        if (search) {
            where.name = { [Op.like]: '%' + search + '%' };
        }

        const allowedSortFields = ['id', 'name', 'price', 'createdAt', 'averageRating', 'stock'];
        const rawSortField = sort.replace('-', '');
        const orderField = allowedSortFields.includes(rawSortField) ? rawSortField : 'createdAt';
        const orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
        const order = [[orderField, orderDir]];

        const total = await Product.count({ where });
        const products = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
            order,
            offset: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            products,
        });
    } catch (error) {
        next(error);
    }
};

export const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        next(error);
    }
};

export const getProductBySlug = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug },
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, discountPrice, images, categoryId, colors, sizes, stock, isFeatured, isActive } = req.body;

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Invalid categoryId: category not found",
            });
        }

        const product = await Product.create({ name, description, price, discountPrice, images, categoryId, colors, sizes, stock, isFeatured, isActive });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const { name, description, price, discountPrice, images, categoryId, colors, sizes, stock, isFeatured, isActive } = req.body;

        if (categoryId) {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid categoryId: category not found",
                });
            }
        }

        await product.update({ name, description, price, discountPrice, images, categoryId, colors, sizes, stock, isFeatured, isActive });

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        for (const imageId of (product.images || [])) {
            try {
                await deleteFile(imageId);
            } catch (e) {
                // GridFS may not be available with SQLite
            }
        }

        await product.destroy();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await Product.findAll({
            where: { isFeatured: true, isActive: true },
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
            limit: 8,
        });

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        next(error);
    }
};
