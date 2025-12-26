const fs = require('fs');

const source = 'C:/Users/casf2/.gemini/antigravity/brain/1d9ba337-e020-43df-8511-591abdbc5c72/uploaded_image_1_1766619566795.jpg';
const dest = 'c:/Users/casf2/Desktop/2multilangue/public/assets/logo.png';

try {
    fs.copyFileSync(source, dest);
    console.log('Logo copied successfully to', dest);
} catch (error) {
    console.error('Error copying logo:', error);
}
