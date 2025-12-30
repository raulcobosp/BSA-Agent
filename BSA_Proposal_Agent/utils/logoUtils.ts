/**
 * Logo Utilities for Cover Image Generation
 * - Fetches customer logo via Google Search
 * - Composites logos onto cover image using Canvas
 */

// Import Nubiral logo (bundled as base64 by Vite)
import nubiralLogo from '../assets/nubiral.png';

/**
 * Search for a company logo URL using the company name
 * Returns the logo as a base64 data URL
 */
export async function fetchCompanyLogo(companyName: string): Promise<string | null> {
    try {
        // Create a search query for the company logo
        const searchQuery = `${companyName} company logo transparent png`;

        // Use Clearbit Logo API as a reliable source (free, no auth needed)
        // Format: https://logo.clearbit.com/:domain
        // We'll try to guess the domain from company name
        const cleanName = companyName.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');

        const possibleDomains = [
            `${cleanName}.com`,
            `${cleanName}.cl`,
            `${cleanName}.co`,
            `${cleanName}.net`,
        ];

        // Try Clearbit API for each possible domain
        for (const domain of possibleDomains) {
            const logoUrl = `https://logo.clearbit.com/${domain}`;
            try {
                const response = await fetch(logoUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch {
                // Try next domain
            }
        }

        // If Clearbit fails, return null (will use placeholder)
        console.warn(`Could not fetch logo for ${companyName}`);
        return null;
    } catch (error) {
        console.error('Logo fetch error:', error);
        return null;
    }
}

/**
 * Load an image from a URL or data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Composite logos onto a cover image
 * - Customer logo on the LEFT
 * - Nubiral logo on the RIGHT
 * 
 * @param baseCoverImage - Base64 data URL of the generated cover image
 * @param customerLogoUrl - Base64 data URL of customer logo (or null)
 * @param companyName - Company name for fallback text
 * @returns Composited image as base64 data URL
 */
export async function compositeLogosOnCover(
    baseCoverImage: string,
    customerLogoUrl: string | null,
    companyName: string
): Promise<string> {
    try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        // Load base cover image
        const baseImg = await loadImage(baseCoverImage);

        // Set canvas size to match base image
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        // Draw base cover image
        ctx.drawImage(baseImg, 0, 0);

        // Logo dimensions and positioning
        const logoHeight = Math.min(80, canvas.height * 0.08);
        const logoY = canvas.height - logoHeight - 30; // 30px from bottom
        const logoMargin = 40;

        // Add semi-transparent bar at bottom for logo visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, canvas.height - logoHeight - 60, canvas.width, logoHeight + 60);

        // Draw Nubiral logo (RIGHT side)
        try {
            const nubiralImg = await loadImage(nubiralLogo);
            const nubiralWidth = (nubiralImg.width / nubiralImg.height) * logoHeight;
            const nubiralX = canvas.width - nubiralWidth - logoMargin;
            ctx.drawImage(nubiralImg, nubiralX, logoY, nubiralWidth, logoHeight);
        } catch (e) {
            console.warn('Could not load Nubiral logo:', e);
        }

        // Draw Customer logo (LEFT side)
        if (customerLogoUrl) {
            try {
                const customerImg = await loadImage(customerLogoUrl);
                const customerWidth = (customerImg.width / customerImg.height) * logoHeight;
                ctx.drawImage(customerImg, logoMargin, logoY, customerWidth, logoHeight);
            } catch (e) {
                // If logo fails to load, draw company name text instead
                drawCompanyNameFallback(ctx, companyName, logoMargin, logoY, logoHeight);
            }
        } else {
            // No customer logo available, draw company name text
            drawCompanyNameFallback(ctx, companyName, logoMargin, logoY, logoHeight);
        }

        // Return composited image
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Logo composite error:', error);
        // Return original image if compositing fails
        return baseCoverImage;
    }
}

/**
 * Draw company name as fallback when logo is not available
 */
function drawCompanyNameFallback(
    ctx: CanvasRenderingContext2D,
    companyName: string,
    x: number,
    y: number,
    height: number
): void {
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${Math.round(height * 0.6)}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(companyName.toUpperCase(), x, y + height / 2);
}

/**
 * Get Nubiral logo as data URL
 */
export function getNubiralLogo(): string {
    return nubiralLogo;
}
