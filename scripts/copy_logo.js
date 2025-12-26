const fs = require('fs');
const path = require('path');

const source = 'C:/Users/casf2/.gemini/antigravity/brain/1d9ba337-e020-43df-8511-591abdbc5c72/uploaded_image_1766618931222.png';
const dest = 'c:/Users/casf2/Desktop/2multilangue/public/assets/logo.png';

fs.copyFileSync(source, dest);
console.log('Logo copied successfully');
