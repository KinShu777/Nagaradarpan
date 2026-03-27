import fs from 'fs';

function getPNGDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readInt32BE(16);
  const height = buf.readInt32BE(20);
  return { width, height };
}

try {
  const dims = getPNGDimensions('public/nagardarpan-logo.png');
  console.log(`Dimensions: ${dims.width}x${dims.height}`);
} catch (e) {
  console.error(e);
}
