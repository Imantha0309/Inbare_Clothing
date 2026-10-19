import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Parse } from '../services/parse.js';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const getUserWishlist = async () => {
        const Wishlist = Parse.Object.extend('Wishlist');
        const query = new Parse.Query(Wishlist);
        query.equalTo('user', Parse.User.current());
        const results = await query.find();
        if (results.length > 0) {
            return results[0];
        }
        const newWishlist = new Wishlist();
        newWishlist.set('user', Parse.User.current());
        newWishlist.set('products', []);
        return await newWishlist.save();
    };

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const wishlist = await getUserWishlist();
            const products = wishlist.get('products') || [];
            setItems(products);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    async function toggleWishlist(productId) {
        if (!user) return;
        try {
            const wishlist = await getUserWishlist();
            const products = wishlist.get('products') || [];
            if (products.includes(productId)) {
                const updated = products.filter((id) => id !== productId);
                wishlist.set('products', updated);
                await wishlist.save();
                setItems(updated);
                return { data: { wishlist: { products: updated }, message: 'Product removed from wishlist' } };
            } else {
                const updated = [...products, productId];
                wishlist.set('products', updated);
                await wishlist.save();
                setItems(updated);
                return { data: { wishlist: { products: updated }, message: 'Product added to wishlist' } };
            }
        } catch (err) {
            console.error('Toggle wishlist failed:', err);
        }
    }

    function isInWishlist(productId) {
        return items.some((p) => (p && p.objectId) === productId || p === productId);
    }

    return (
        <WishlistContext.Provider value={{ items, loading, toggleWishlist, isInWishlist, fetchWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
}
