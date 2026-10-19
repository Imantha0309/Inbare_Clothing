import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import './ProductForm.css';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Navy', 'Gray', 'Brown', 'Beige', 'Red', 'Green', 'Blue', 'Cream'];

export default function ProductForm({ product, categories, onClose, onSuccess }) {
    const isEdit = !!product;
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        discountPrice: product?.discountPrice || '',
        category: product?.categoryId || product?.category?._id || product?.category || '',
        stock: product?.stock ?? '',
        isFeatured: product?.isFeatured || false,
        isActive: product?.isActive ?? true,
        sizes: product?.sizes || [],
        colors: product?.colors || [],
    });

    const [images, setImages] = useState(product?.images || []);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const toggleArrayItem = (field, item) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter((i) => i !== item)
                : [...prev[field], item],
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        setError('');

        try {
            const uploadedUrls = await Promise.all(files.map((file) => adminService.uploadFile(file)));
            setImages((prev) => [...prev, ...uploadedUrls]);
        } catch (err) {
            setError(err.message || 'Image upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name || !form.description || !form.price || !form.category || form.stock === '') {
            setError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...form,
                price: Number(form.price),
                discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
                stock: Number(form.stock),
                images,
            };

            if (isEdit) {
                await adminService.updateProduct(product._id, payload);
            } else {
                await adminService.createProduct(payload);
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pf-overlay" onClick={onClose}>
            <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pf-header">
                    <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
                    <button className="pf-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form className="pf-form" onSubmit={handleSubmit}>
                    {error && <div className="pf-error">{error}</div>}

                    <div className="pf-grid">
                        <div className="pf-field pf-full">
                            <label htmlFor="pf-name">Product Name *</label>
                            <input id="pf-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Classic Cotton Tee" />
                        </div>

                        <div className="pf-field pf-full">
                            <label htmlFor="pf-description">Description *</label>
                            <textarea id="pf-description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the product..." />
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-price">Price *</label>
                            <input id="pf-price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" />
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-discountPrice">Discount Price</label>
                            <input id="pf-discountPrice" name="discountPrice" type="number" step="0.01" min="0" value={form.discountPrice} onChange={handleChange} placeholder="0.00" />
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-category">Category *</label>
                            <select id="pf-category" name="category" value={form.category} onChange={handleChange}>
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-stock">Stock *</label>
                            <input id="pf-stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0" />
                        </div>

                        <div className="pf-field pf-full">
                            <label>Sizes</label>
                            <div className="pf-chips">
                                {SIZES.map((s) => (
                                    <button key={s} type="button"
                                        className={`pf-chip ${form.sizes.includes(s) ? 'active' : ''}`}
                                        onClick={() => toggleArrayItem('sizes', s)}
                                    >{s}</button>
                                ))}
                            </div>
                        </div>

                        <div className="pf-field pf-full">
                            <label>Colors</label>
                            <div className="pf-chips">
                                {COLORS.map((c) => (
                                    <button key={c} type="button"
                                        className={`pf-chip ${form.colors.includes(c) ? 'active' : ''}`}
                                        onClick={() => toggleArrayItem('colors', c)}
                                    >{c}</button>
                                ))}
                            </div>
                        </div>

                        <div className="pf-field pf-full">
                            <label>Images</label>
                            <div className="pf-images">
                                {images.map((img, i) => (
                                    <div key={i} className="pf-image-preview">
                                        <img src={imageUrl(img)} alt="" />
                                        <button type="button" className="pf-image-remove" onClick={() => removeImage(i)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <label className="pf-image-upload">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {uploading ? (
                                        <Loader2 size={24} className="pf-spin" />
                                    ) : (
                                        <>
                                            <Upload size={20} />
                                            <span>Add Images</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="pf-field pf-full pf-checks">
                            <label className="pf-check">
                                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                                Featured product
                            </label>
                            <label className="pf-check">
                                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                                Active (visible on store)
                            </label>
                        </div>
                    </div>

                    <div className="pf-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={submitting || uploading}>
                            {submitting ? <><Loader2 size={16} className="pf-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
