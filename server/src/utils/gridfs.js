import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const EXT_BY_MIME = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const getSafeExtension = (mimetype) => EXT_BY_MIME[mimetype] || '.bin';

// Reject any user-controlled path segments (defence in depth)
const isSafeFileId = (fileId) => typeof fileId === 'string' && !fileId.includes('..') && !fileId.includes('/') && !fileId.includes('\\');

const isValidImageBuffer = (buffer, mimetype) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
    if (mimetype === 'image/jpeg' && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    if (mimetype === 'image/png' && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    if (mimetype === 'image/webp'
        && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
        && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
    return false;
};

export async function uploadFile(file) {
    const ext = getSafeExtension(file.mimetype);
    if (!isValidImageBuffer(file.buffer, file.mimetype)) {
        throw new Error("Invalid image file");
    }
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, file.buffer, (err) => {
            if (err) return reject(err);
            resolve(filename); // Return generated filename as ID
        });
    });
}

export async function downloadFile(fileId) {
    if (!isSafeFileId(fileId)) return null;

    const filepath = path.join(UPLOAD_DIR, fileId);

    if (!fs.existsSync(filepath)) {
        return null;
    }

    const stats = fs.statSync(filepath);
    const stream = fs.createReadStream(filepath);

    const ext = path.extname(fileId).toLowerCase();
    const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };

    return {
        stream: stream,
        contentType: contentTypeMap[ext] || 'application/octet-stream',
        filename: fileId,
        size: stats.size
    };
}

export async function deleteFile(fileId) {
    if (!isSafeFileId(fileId)) return;

    const filepath = path.join(UPLOAD_DIR, fileId);

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath)) {
            return resolve(); // File doesn't exist, consider it deleted
        }

        fs.unlink(filepath, (err) => {
            if (err && err.code !== 'ENOENT') {
                return reject(err);
            }
            resolve();
        });
    });
}
