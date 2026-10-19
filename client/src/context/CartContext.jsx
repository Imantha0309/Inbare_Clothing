import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Parse } from '../services/parse.js';
import { useAuth } from './AuthContext';

const CartContext = createContext();

function normalizeServerItem(item) {
    return {
        productId: item.productId || item.product || '',
        name: item.name || '',
        price: item.price || 0,
        img: item.image || '',
        selectedColor: item.color || '',
        selectedSize: item.size || '',
        qty: item.quantity || item.qty || 1,
    };
}

export function CartProvider({ children }) {
    const [cartOpen, setCartOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, setFetchCart } = useAuth();

    // Get or create the Parse Cart object for the current user
    const getUserCart = async () => {
        const Cart = Parse.Object.extend('Cart');
        const query = new Parse.Query(Cart);
        query.equalTo('user', Parse.User.current());
        const results = await query.find();
        if (results.length > 0) {
            return results[0];
        }
        // Create a new cart
        const newCart = new Cart();
        newCart.set('user', Parse.User.current());
        newCart.set('items', []);
        newCart.set('totalAmount', 0);
        return await newCart.save();
    };

    const fetchCart = useCallback(async () => {
        if (!user) {
            const saved = localStorage.getItem('guestCart');
            setItems(saved ? JSON.parse(saved) : []);
            return;
        }

        // Merge guest cart into server cart on login
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
            try {
                const cart = await getUserCart();
                const existingItems = cart.get('items') || [];
                const merged = [...existingItems];
                for (const item of guestCart) {
                    const color = typeof item.selectedColor === 'object'
                        ? (item.selectedColor?.label || '')
                        : (item.selectedColor || '');
                    const existingIndex = merged.findIndex(
                        (i) => i.productId === item.productId && i.size === item.selectedSize && i.color === color
                    );
                    if (existingIndex > -1) {
                        merged[existingIndex].quantity += item.qty || 1;
                    } else {
                        merged.push({
                            productId: item.productId,
                            name: item.name,
                            price: item.price,
                            image: item.img || item.image,
                            size: item.selectedSize || '',
                            color: color,
                            quantity: item.qty || 1,
                        });
                    }
                }
                cart.set('items', merged);
                cart.set('totalAmount', merged.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0));
                await cart.save();
                localStorage.removeItem('guestCart');
            } catch {
                // skip failed merge
            }
        }

        try {
            const cart = await getUserCart();
            const raw = cart.get('items') || [];
            setItems(raw.map(normalizeServerItem));
        } catch {
            setItems([]);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    useEffect(() => {
        setFetchCart(fetchCart);
    }, [setFetchCart, fetchCart]);

    useEffect(() => {
        if (!user) {
            localStorage.setItem('guestCart', JSON.stringify(items));
        }
    }, [items, user]);

    const saveCartItems = async (newItems) => {
        try {
            const cart = await getUserCart();
            const totalAmount = newItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || i.qty || 1), 0);
            cart.set('items', newItems);
            cart.set('totalAmount', totalAmount);
            await cart.save();
        } catch (err) {
            console.error('Save cart failed:', err);
        }
    };

    async function addToCart(product) {
        if (!user) {
            setItems((prev) => {
                const existing = prev.find(
                    (item) => item.productId === product.productId && item.selectedColor === product.selectedColor && item.selectedSize === product.selectedSize
                );
                if (existing) {
                    return prev.map((item) =>
                        item.productId === product.productId && item.selectedColor === product.selectedColor && item.selectedSize === product.selectedSize
                            ? { ...item, qty: item.qty + 1 }
                            : item
                    );
                }
                return [...prev, { ...product, qty: 1 }];
            });
            return;
        }
        setLoading(true);
        try {
            const cart = await getUserCart();
            const color = typeof product.selectedColor === 'object' ? (product.selectedColor?.label || '') : (product.selectedColor || '');
            const size = product.selectedSize || '';
            const items = cart.get('items') || [];

            const existingIndex = items.findIndex(
                (item) => String(item.productId) === String(product.productId) && item.size === size && item.color === color
            );

            if (existingIndex > -1) {
                items[existingIndex].quantity += 1;
            } else {
                items.push({
                    productId: product.productId,
                    name: product.name,
                    price: product.price || 0,
                    image: product.img || '',
                    size: size,
                    color: color,
                    quantity: 1,
                });
            }

            cart.set('items', items);
            cart.set('totalAmount', items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0));
            await cart.save();

            setItems(items.map(normalizeServerItem));
        } catch (err) {
            console.error('Add to cart failed:', err);
        } finally {
            setLoading(false);
        }
    }

    async function removeFromCart(productId, selectedColor, selectedSize) {
        if (!user) {
            setItems((prev) => prev.filter(
                (item) => !(item.productId === productId && item.selectedColor === selectedColor && item.selectedSize === selectedSize)
            ));
            return;
        }
        try {
            const cart = await getUserCart();
            const color = typeof selectedColor === 'object' ? (selectedColor?.label || '') : (selectedColor || '');
            const size = selectedSize || '';
            const items = cart.get('items') || [];
            const filtered = items.filter(
                (item) => !(String(item.productId) === String(productId) && item.size === size && item.color === color)
            );
            cart.set('items', filtered);
            cart.set('totalAmount', filtered.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0));
            await cart.save();
            setItems(filtered.map(normalizeServerItem));
        } catch (err) {
            console.error('Remove from cart failed:', err);
        }
    }

    async function updateQty(productId, selectedColor, selectedSize, qty) {
        if (qty <= 0) {
            removeFromCart(productId, selectedColor, selectedSize);
            return;
        }
        if (!user) {
            setItems((prev) =>
                prev.map((item) =>
                    item.productId === productId && item.selectedColor === selectedColor && item.selectedSize === selectedSize
                        ? { ...item, qty }
                        : item
                )
            );
            return;
        }
        try {
            const cart = await getUserCart();
            const color = typeof selectedColor === 'object' ? (selectedColor?.label || '') : (selectedColor || '');
            const size = selectedSize || '';
            const items = cart.get('items') || [];
            const itemIndex = items.findIndex(
                (item) => String(item.productId) === String(productId) && item.size === size && item.color === color
            );
            if (itemIndex > -1) {
                items[itemIndex].quantity = qty;
                cart.set('items', items);
                cart.set('totalAmount', items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0));
                await cart.save();
                setItems(items.map(normalizeServerItem));
            }
        } catch (err) {
            console.error('Update cart failed:', err);
        }
    }

    async function clearCart() {
        if (!user) {
            setItems([]);
            return;
        }
        try {
            const cart = await getUserCart();
            cart.set('items', []);
            cart.set('totalAmount', 0);
            await cart.save();
            setItems([]);
        } catch (err) {
            console.error('Clear cart failed:', err);
        }
    }

    const totalItems = items.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || item.quantity || 0), 0);

    return (
        <CartContext.Provider
            value={{
                cartOpen,
                setCartOpen,
                items,
                addToCart,
                removeFromCart,
                updateQty,
                clearCart,
                totalItems,
                subtotal,
                loading,
                fetchCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
