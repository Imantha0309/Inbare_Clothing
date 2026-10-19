import { Parse } from '../services/parse.js';

const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');
const Order = Parse.Object.extend('Order');
const User = Parse.Object.extend('_User');
const Review = Parse.Object.extend('Review');
const Wishlist = Parse.Object.extend('Wishlist');
const Coupon = Parse.Object.extend('Coupon');
const Cart = Parse.Object.extend('Cart');

// Helper to serialize Parse objects
const serialize = (obj) => {
    if (!obj) return null;
    const data = obj.toJSON();
    return {
        ...data,
        _id: obj.id,
        objectId: obj.id,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
};

export const adminService = {
    // ============ Products ============
    async getProducts({ page = 1, limit = 12, all = 'true', sort = '-createdAt', search, category }) {
        const query = new Parse.Query(Product);
        if (all !== 'true') {
            query.equalTo('isActive', true);
        }
        if (search) query.contains('name', search);
        if (category) query.equalTo('categoryId', category);

        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'descending' : 'ascending';
        if (sortOrder === 'descending') query.descending(sortField);
        else query.ascending(sortField);

        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            products: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    async createProduct(data) {
        const product = new Product();
        product.set('name', data.name);
        product.set('description', data.description);
        product.set('price', Number(data.price));
        product.set('discountPrice', data.discountPrice ? Number(data.discountPrice) : 0);
        product.set('categoryId', data.category);
        product.set('stock', Number(data.stock));
        product.set('isFeatured', data.isFeatured || false);
        product.set('isActive', data.isActive !== false);
        product.set('images', data.images || []);
        product.set('colors', data.colors || []);
        product.set('sizes', data.sizes || []);
        const saved = await product.save();
        return serialize(saved);
    },

    async updateProduct(id, data) {
        const query = new Parse.Query(Product);
        query.equalTo('objectId', id);
        const product = await query.first();
        if (!product) throw new Error('Product not found');

        product.set('name', data.name);
        product.set('description', data.description);
        product.set('price', Number(data.price));
        product.set('discountPrice', data.discountPrice ? Number(data.discountPrice) : 0);
        product.set('categoryId', data.category);
        product.set('stock', Number(data.stock));
        product.set('isFeatured', data.isFeatured || false);
        product.set('isActive', data.isActive !== false);
        product.set('images', data.images || []);
        product.set('colors', data.colors || []);
        product.set('sizes', data.sizes || []);
        const saved = await product.save();
        return serialize(saved);
    },

    async deleteProduct(id) {
        const query = new Parse.Query(Product);
        query.equalTo('objectId', id);
        const product = await query.first();
        if (product) await product.destroy();
    },

    async toggleProduct(id, isActive) {
        const query = new Parse.Query(Product);
        query.equalTo('objectId', id);
        const product = await query.first();
        if (product) {
            product.set('isActive', isActive);
            await product.save();
        }
    },

    // ============ Categories ============
    async getCategories({ withCount = false } = {}) {
        const query = new Parse.Query(Category);
        query.ascending('name');
        const results = await query.find();
        return results.map((c) => {
            const data = serialize(c);
            if (withCount) {
                data.productCount = 0; // Parse doesn't easily do counts without a separate query
            }
            return data;
        });
    },

    async createCategory(data) {
        const category = new Category();
        category.set('name', data.name);
        category.set('description', data.description || '');
        category.set('image', data.image || '');
        category.set('isActive', data.isActive !== false);
        const saved = await category.save();
        return serialize(saved);
    },

    async updateCategory(id, data) {
        const query = new Parse.Query(Category);
        query.equalTo('objectId', id);
        const category = await query.first();
        if (!category) throw new Error('Category not found');
        category.set('name', data.name);
        category.set('description', data.description || '');
        category.set('image', data.image || '');
        category.set('isActive', data.isActive !== false);
        const saved = await category.save();
        return serialize(saved);
    },

    async deleteCategory(id) {
        const query = new Parse.Query(Category);
        query.equalTo('objectId', id);
        const category = await query.first();
        if (category) await category.destroy();
    },

    async toggleCategory(id, isActive) {
        const query = new Parse.Query(Category);
        query.equalTo('objectId', id);
        const category = await query.first();
        if (category) {
            category.set('isActive', isActive);
            await category.save();
        }
    },

    // ============ Orders ============
    async getOrders({ page = 1, limit = 10, sort = '-createdAt', status }) {
        const query = new Parse.Query(Order);
        if (status) query.equalTo('orderStatus', status);

        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'descending' : 'ascending';
        if (sortOrder === 'descending') query.descending(sortField);
        else query.ascending(sortField);

        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            orders: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    async getOrder(id) {
        const query = new Parse.Query(Order);
        query.equalTo('objectId', id);
        const order = await query.first();
        if (!order) return null;
        return serialize(order);
    },

    async updateOrderStatus(id, updates) {
        const query = new Parse.Query(Order);
        query.equalTo('objectId', id);
        const order = await query.first();
        if (!order) throw new Error('Order not found');
        if (updates.orderStatus) order.set('orderStatus', updates.orderStatus);
        if (updates.paymentStatus) order.set('paymentStatus', updates.paymentStatus);
        const saved = await order.save();
        return serialize(saved);
    },

    // ============ Users ============
    async getUsers({ page = 1, limit = 12, role }) {
        const query = new Parse.Query(User);
        if (role) query.equalTo('role', role);
        query.ascending('createdAt');
        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            users: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    async updateUser(id, data) {
        const query = new Parse.Query(User);
        query.equalTo('objectId', id);
        const user = await query.first();
        if (!user) throw new Error('User not found');
        if (data.firstName) user.set('firstName', data.firstName);
        if (data.lastName) user.set('lastName', data.lastName);
        if (data.email) user.set('email', data.email);
        if (data.phone) user.set('phone', data.phone);
        if (data.role) user.set('role', data.role);
        if (data.isActive !== undefined) user.set('isActive', data.isActive);
        const saved = await user.save();
        return serialize(saved);
    },

    async deleteUser(id) {
        const query = new Parse.Query(User);
        query.equalTo('objectId', id);
        const user = await query.first();
        if (user) await user.destroy();
    },

    // ============ Reviews ============
    async getReviews({ page = 1, limit = 15, rating }) {
        const query = new Parse.Query(Review);
        if (rating) query.equalTo('rating', Number(rating));
        query.descending('createdAt');
        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            reviews: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    async deleteReview(id) {
        const query = new Parse.Query(Review);
        query.equalTo('objectId', id);
        const review = await query.first();
        if (review) await review.destroy();
    },

    // ============ Wishlists ============
    async getWishlists({ page = 1, limit = 12 }) {
        const query = new Parse.Query(Wishlist);
        query.descending('createdAt');
        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            wishlists: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    // ============ Coupons ============
    async getCoupons({ page = 1, limit = 20 }) {
        const query = new Parse.Query(Coupon);
        query.descending('createdAt');
        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));

        const [results, total] = await Promise.all([
            query.find(),
            query.count(),
        ]);

        return {
            coupons: results.map(serialize),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            currentPage: Number(page),
        };
    },

    // ============ Dashboard Stats ============
    async getDashboardStats() {
        // Aggregate stats from individual queries (client-side aggregation)
        const [productResult, userResult, orderResult, categoryResult, couponResult] = await Promise.all([
            new Parse.Query(Product).count(),
            new Parse.Query(User).equalTo('role', 'customer').count(),
            new Parse.Query(Order).count(),
            new Parse.Query(Category).count(),
            new Parse.Query(Coupon).count(),
        ]);

        // Get total revenue
        const orderQuery = new Parse.Query(Order);
        const orders = await orderQuery.find();
        const totalRevenue = orders.reduce((sum, o) => sum + (o.get('totalAmount') || 0), 0);

        // Get recent orders
        const recentOrderQuery = new Parse.Query(Order);
        recentOrderQuery.descending('createdAt');
        recentOrderQuery.limit(5);
        const recentOrders = await recentOrderQuery.find();

        // Get orders by status
        const statusQuery = new Parse.Query(Order);
        const allOrders = await statusQuery.find();
        const ordersByStatus = {};
        allOrders.forEach((o) => {
            const status = o.get('orderStatus');
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
        });

        // Get low stock products
        const lowStockQuery = new Parse.Query(Product);
        lowStockQuery.lessThanOrEqualTo('stock', 10);
        lowStockQuery.ascending('stock');
        lowStockQuery.limit(5);
        const lowStock = await lowStockQuery.find();

        return {
            stats: {
                totalProducts: productResult,
                totalUsers: userResult,
                totalCategories: categoryResult,
                totalOrders: orderResult,
                totalRevenue,
                recentOrders: recentOrders.map(serialize),
                ordersByStatus,
                lowStockProducts: lowStock.map(serialize),
            },
        };
    },

    async createCoupon(data) {
        const coupon = new Coupon();
        coupon.set('code', data.code);
        coupon.set('discountType', data.discountType);
        coupon.set('discountValue', Number(data.discountValue));
        coupon.set('minOrderAmount', data.minOrderAmount ? Number(data.minOrderAmount) : 0);
        coupon.set('maxUses', data.maxUses ? Number(data.maxUses) : null);
        coupon.set('expiresAt', data.expiresAt ? new Date(data.expiresAt) : null);
        coupon.set('isActive', data.isActive !== false);
        coupon.set('usedCount', 0);
        const saved = await coupon.save();
        return serialize(saved);
    },

    async updateCoupon(id, data) {
        const query = new Parse.Query(Coupon);
        query.equalTo('objectId', id);
        const coupon = await query.first();
        if (!coupon) throw new Error('Coupon not found');
        if (data.code) coupon.set('code', data.code);
        if (data.discountType) coupon.set('discountType', data.discountType);
        if (data.discountValue !== undefined) coupon.set('discountValue', Number(data.discountValue));
        if (data.minOrderAmount !== undefined) coupon.set('minOrderAmount', Number(data.minOrderAmount));
        if (data.maxUses !== undefined) coupon.set('maxUses', data.maxUses ? Number(data.maxUses) : null);
        if (data.expiresAt !== undefined) coupon.set('expiresAt', data.expiresAt ? new Date(data.expiresAt) : null);
        if (data.isActive !== undefined) coupon.set('isActive', data.isActive);
        const saved = await coupon.save();
        return serialize(saved);
    },

    async deleteCoupon(id) {
        const query = new Parse.Query(Coupon);
        query.equalTo('objectId', id);
        const coupon = await query.first();
        if (coupon) await coupon.destroy();
    },

    // ============ File Upload ============
    async uploadFile(file) {
        // Parse.File requires base64 data or a blob
        const base64 = await fileToBase64(file);
        const parseFile = new Parse.File(file.name, { base64 });
        const saved = await parseFile.save();
        return saved.url();
    },
};

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
}
