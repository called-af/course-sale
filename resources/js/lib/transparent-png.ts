export const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;
export const SIGNATURE_MAX_DIMENSION = 4096;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Client-side counterpart of App\Rules\TransparentPng.
 * Returns a user-facing error string, or null when the file is accepted.
 */
export async function validateTransparentPng(file: File): Promise<string | null> {
    if (!/\.png$/i.test(file.name) && file.type !== 'image/png') {
        return 'Use a PNG image for the signature.';
    }

    if (file.size > SIGNATURE_MAX_BYTES) {
        return 'Signature image must be 2 MB or smaller.';
    }

    const header = new Uint8Array(await file.slice(0, PNG_SIGNATURE.length).arrayBuffer());
    if (PNG_SIGNATURE.some((byte, index) => header[index] !== byte)) {
        return 'This file is not a valid PNG image.';
    }

    const url = URL.createObjectURL(file);

    try {
        const image = await loadImage(url);

        if (image.naturalWidth > SIGNATURE_MAX_DIMENSION || image.naturalHeight > SIGNATURE_MAX_DIMENSION) {
            return 'Signature image must be 4096 × 4096 px or smaller.';
        }

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return 'Could not read this image.';

        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

        for (let index = 3; index < data.length; index += 4) {
            if (data[index] < 255) return null;
        }

        return 'Signature must have a transparent background. Use a PNG with no background.';
    } catch {
        return 'Could not read this image.';
    } finally {
        URL.revokeObjectURL(url);
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image failed to load'));
        image.src = src;
    });
}
