import { Parse } from './parse.js';

const Order = Parse.Object.extend('Order');
const Coupon = Parse.Object.extend('Coupon');
const Product = Parse.Object.extend('Product');
const Cart = Parse.Object.extend('Cart');

export const orderService = {
    // Get orders for the current user
    async getMyOrders({ page = 1, limit = 10 }) {
        const query = new Parse.Query(Order);
        query.equalTo('user', Parse.User.current());
        query.descending('createdAt');
        query.skip((Number(page) - 1) * Number(limit));
        query.limit(Number(limit));
        const results = await query.find();
        const total = await new Parse.Query(Order).equalTo('user', Parse.User.current()).count();

        return {
            orders: results.map((o) => this._serialize(o)),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
        };
    },

    // Create a new order from cart items
    async createOrder({ shippingAddress, paymentMethod, note, couponCode }) {
        try {
            // Get current user's cart
            const Cart = Parse.Object.extend('Cart');
            const cartQuery = new Parse.Query(Cart);
            cartQuery.equalTo('user', Parse.User.current());
            const cartResults = await cartQuery.find();

            if (cartResults.length === 0) {
                throw new Error('Cart is empty');
            }

            const cart = cartResults[0];
            const cartItems = cart.get('items') || [];

            if (cartItems.length === 0) {
                throw new Error('Cart is empty');
            }

            // Validate stock and calculate total
            let totalAmount = 0;
            const orderItems = [];

            for (const item of cartItems) {
                const productQuery = new Parse.Query(Product);
                productQuery.equalTo('objectId', item.productId);
                const product = await productQuery.first();

                if (!product) {
                    throw new Error(`Product not found: ${item.name}`);
                }

                if (product.get('stock') < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.name}`);
                }

                const itemPrice = item.price || 0;
                totalAmount += itemPrice * item.quantity;

                orderItems.push({
                    product: item.productId,
                    name: item.name,
                    price: itemPrice,
                    image: item.image,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                });
            }

            // Apply coupon
            let discountAmount = 0;
            let appliedCouponCode = null;

            if (couponCode) {
                const couponQuery = new Parse.Query(Coupon);
                couponQuery.equalTo('code', couponCode.toUpperCase());
                const coupon = await couponQuery.first();

                if (!coupon || !coupon.get('isActive')) {
                    throw new Error('Invalid coupon code');
                }

                if (coupon.get('expiresAt') && coupon.get('expiresAt') < new Date()) {
                    throw new Error('This coupon has expired');
                }

                if (coupon.get('maxUses') !== null && coupon.get('usedCount') >= coupon.get('maxUses')) {
                    throw new Error('This coupon has reached its usage limit');
                }

                if (totalAmount < (coupon.get('minOrderAmount') || 0)) {
                    throw new Error(`Minimum order amount for this coupon is LKR ${coupon.get('minOrderAmount')}`);
                }

                if (coupon.get('discountType') === 'percent') {
                    discountAmount = Math.round((totalAmount * coupon.get('discountValue')) / 100);
                } else {
                    discountAmount = Math.min(coupon.get('discountValue'), totalAmount);
                }

                totalAmount = Math.max(0, totalAmount - discountAmount);
                appliedCouponCode = coupon.get('code');

                // Increment coupon used count
                coupon.set('usedCount', coupon.get('usedCount') + 1);
                await coupon.save();
            }

            // Create the order
            const order = new Order();
            order.set('user', Parse.User.current());
            order.set('items', orderItems);
            order.set('street', shippingAddress.street);
            order.set('city', shippingAddress.city);
            order.set('state', shippingAddress.state);
            order.set('zipCode', shippingAddress.zipCode);
            order.set('country', shippingAddress.country || 'Sri Lanka');
            order.set('paymentMethod', paymentMethod);
            order.set('paymentStatus', 'pending');
            order.set('orderStatus', 'pending');
            order.set('totalAmount', totalAmount);
            order.set('shippingCost', shippingAddress.shippingCost || 0);
            order.set('note', note || '');
            order.set('couponCode', appliedCouponCode);
            order.set('discountAmount', discountAmount);

            await order.save();

            // Decrement stock for each item
            for (const item of cartItems) {
                const productQuery = new Parse.Query(Product);
                productQuery.equalTo('objectId', item.productId);
                const product = await productQuery.first();
                if (product) {
                    product.increment('stock', -item.quantity);
                    await product.save();
                }
            }

            // Clear cart
            cart.set('items', []);
            cart.set('totalAmount', 0);
            await cart.save();

            return { data: { order: this._serialize(order) } };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    },

    // Serialize Order Parse Object
    _serialize(parseObject) {
        if (!parseObject) return null;
        const data = parseObject.toJSON();
        return {
            ...data,
            _id: parseObject.id,
            objectId: parseObject.id,
            createdAt: parseObject.createdAt,
            updatedAt: parseObject.updatedAt,
            // Parse stores pointers as objects with __type and objectId
            user: data.user?.objectId || data.user,
        };
    },
};

export const couponService = {
    // Validate a coupon code
    async validateCoupon({ code }) {
        try {
            if (!code) {
                throw new Error('Coupon code is required');
            }

            const query = new Parse.Query(Coupon);
            query.equalTo('code', code.toUpperCase());
            const coupon = await query.first();

            if (!coupon) {
                throw new Error('Invalid coupon code');
            }

            if (!coupon.get('isActive')) {
                throw new Error('This coupon is no longer active');
            }

            if (coupon.get('expiresAt') && coupon.get('expiresAt') < new Date()) {
                throw new Error('This coupon has expired');
            }

            if (coupon.get('maxUses') !== null && coupon.get('usedCount') >= coupon.get('maxUses')) {
                throw new Error('This coupon has reached its usage limit');
            }

            return {
                data: {
                    coupon: {
                        code: coupon.get('code'),
                        discountType: coupon.get('discountType'),
                        discountValue: coupon.get('discountValue'),
                        minOrderAmount: coupon.get('minOrderAmount'),
                    },
                },
            };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    },
};
