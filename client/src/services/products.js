import { Parse } from './parse.js';

const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');

export const productService = {
    // Get all active products with pagination
    async getProducts({ page = 1, limit = 10, category, minPrice, maxPrice, search, featured, sort = '-createdAt', all = 'false' }) {
        const query = new Parse.Query(Product);

        if (all !== 'true') {
            query.equalTo('isActive', true);
        }

        if (category) {
            query.equalTo('categoryId', category);
        }

        if (featured === 'true') {
            query.equalTo('isFeatured', true);
        }

        if (minPrice) {
            query.greaterThanOrEqualTo('price', Number(minPrice));
        }

        if (maxPrice) {
            query.lessThanOrEqualTo('price', Number(maxPrice));
        }

        if (search) {
            query.contains('name', search);
        }

        // Sorting
        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'descending' : 'ascending';
        if (sortOrder === 'descending') {
            query.descending(sortField);
        } else {
            query.ascending(sortField);
        }

        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const results = await query.find();
        const total = await query.count();

        return {
            products: results.map((p) => this._serialize(p)),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
        };
    },

    // Get a single product by ID
    async getProduct(id) {
        const query = new Parse.Query(Product);
        query.equalTo('objectId', id);
        const result = await query.first();
        if (!result) return null;
        return { product: this._serialize(result) };
    },

    // Get a product by slug
    async getProductBySlug(slug) {
        const query = new Parse.Query(Product);
        query.equalTo('slug', slug);
        const result = await query.first();
        if (!result) return null;
        return { product: this._serialize(result) };
    },

    // Get featured products
    async getFeaturedProducts(limit = 8) {
        const query = new Parse.Query(Product);
        query.equalTo('isFeatured', true);
        query.equalTo('isActive', true);
        query.limit(limit);
        const results = await query.find();
        return {
            products: results.map((p) => this._serialize(p)),
            count: results.length,
        };
    },

    // Serialize a Parse Object to a plain JSON object
    _serialize(parseObject) {
        if (!parseObject) return null;
        const data = parseObject.toJSON();
        return {
            ...data,
            _id: parseObject.id,
            objectId: parseObject.id,
            createdAt: parseObject.createdAt,
            updatedAt: parseObject.updatedAt,
            // Handle images - could be Parse.File objects or strings
            images: Array.isArray(data.images)
                ? data.images.map((img) => (typeof img === 'object' && img.url ? img.url() : img))
                : data.images || [],
        };
    },
};

// Category service using Parse
export const categoryService = {
    async getAll() {
        const query = new Parse.Query(Category);
        query.equalTo('isActive', true);
        query.ascending('name');
        const results = await query.find();
        return results.map((c) => ({
            ...c.toJSON(),
            _id: c.id,
            objectId: c.id,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));
    },

    async getBySlug(slug) {
        const query = new Parse.Query(Category);
        query.equalTo('slug', slug);
        const result = await query.first();
        if (!result) return null;
        return {
            ...result.toJSON(),
            _id: result.id,
            objectId: result.id,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
    },

    async getById(id) {
        const query = new Parse.Query(Category);
        query.equalTo('objectId', id);
        const result = await query.first();
        if (!result) return null;
        return {
            ...result.toJSON(),
            _id: result.id,
            objectId: result.id,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
    },
};

