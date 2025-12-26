const Jimp = require('jimp');
const path = require('path');

const source = 'C:/Users/casf2/.gemini/antigravity/brain/1d9ba337-e020-43df-8511-591abdbc5c72/uploaded_image_1_1766619566795.jpg';
const dest = 'c:/Users/casf2/Desktop/2multilangue/public/assets/logo.png';

async function processLogo() {
    try {
        const image = await Jimp.read(source);
        const targetColor = { r: 255, g: 255, b: 255, a: 255 }; // White
        const replaceColor = { r: 0, g: 0, b: 0, a: 0 }; // Transparent
        const colorDistance = (c1, c2) => Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            if (colorDistance({ r, g, b }, targetColor) < 50) { // Tolerance
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0
            }
        });

        await image.writeAsync(dest);
        console.log('Logo processed and saved at', dest);
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

processLogo();
