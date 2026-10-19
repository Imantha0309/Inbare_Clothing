import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import './CategoryForm.css';

export default function CategoryForm({ category, onClose, onSuccess }) {
    const isEdit = !!category;
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: category?.name || '',
        description: category?.description || '',
        isActive: category?.isActive ?? true,
    });

    const [image, setImage] = useState(category?.image || '');
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            const imageUrl = await adminService.uploadFile(file);
            setImage(imageUrl);
        } catch (err) {
            setError(err.message || 'Image upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Category name is required');
            return;
        }

        setSubmitting(true);

        try {
            const payload = { ...form, image };

            if (isEdit) {
                await adminService.updateCategory(category._id, payload);
            } else {
                await adminService.createCategory(payload);
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cf-overlay" onClick={onClose}>
            <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cf-header">
                    <h2>{isEdit ? 'Edit Category' : 'Add New Category'}</h2>
                    <button className="cf-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form className="cf-form" onSubmit={handleSubmit}>
                    {error && <div className="cf-error">{error}</div>}

                    <div className="cf-field">
                        <label htmlFor="cf-name">Name *</label>
                        <input
                            id="cf-name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. T-Shirts, Accessories"
                        />
                    </div>

                    <div className="cf-field">
                        <label htmlFor="cf-description">Description</label>
                        <textarea
                            id="cf-description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="cf-field">
                        <label>Image</label>
                        <div className="cf-image-section">
                            {image && (
                                <div className="cf-image-preview">
                                    <img src={imageUrl(image)} alt="" />
                                    <button type="button" className="cf-image-remove" onClick={() => setImage('')}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <label className="cf-image-upload">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                {uploading ? (
                                    <Loader2 size={20} className="cf-spin" />
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        <span>{image ? 'Replace Image' : 'Upload Image'}</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="cf-field">
                        <label className="cf-check">
                            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                            Active (visible on store)
                        </label>
                    </div>

                    <div className="cf-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={submitting || uploading}>
                            {submitting ? <><Loader2 size={16} className="cf-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
