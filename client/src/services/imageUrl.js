const API_BASE = import.meta.env.VITE_API_URL || 'https://parseapi.back4app.com';

export function imageUrl(imageId) {
    if (!imageId) return null;

    // If it's a Parse.File object, use its url() method
    if (typeof imageId === 'object' && imageId.url && typeof imageId.url === 'function') {
        return imageId.url();
    }

    // If it's already a full URL
    if (typeof imageId === 'string' && imageId.startsWith('http')) {
        return imageId;
    }

    // If it's a Parse File ID or URL path
    return `${API_BASE}/files/${imageId}`;
}
