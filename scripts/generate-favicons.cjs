const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Base 512x512 SVG with #111111 dark background and ~15% padding around the gold mark
const iconSvg512 = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#111111"/>
  <g fill="#E5BC75" transform="translate(76.2, 74.75) scale(2.9)">
    <g transform="translate(10, 0)">
      <!-- Upper-left angular stroke -->
      <path d="M14 11 L18 1 H51 V55 H42 V11 Z"/>
      <!-- Inner-left angular stroke -->
      <path d="M4 28 L8 18 H35 V55 H25 V28 Z"/>
      <!-- Upper-right / outer tall stroke -->
      <path d="M63 11 L69 1 H104 V124 H95 V11 Z"/>
      <!-- Inner tall stroke -->
      <path d="M63 28 L68 18 H86 V124 H79 V28 Z"/>

      <!-- Three equal-height trapezoids, all centered on x=34 -->
      <path d="M0 63 H68 L63 72 H5 Z"/>
      <path d="M4 76 H64 L59 85 H9 Z"/>
      <path d="M9 89 H59 L54 98 H14 Z"/>

      <!-- Two identical square blocks, evenly spaced and centered as a pair -->
      <rect x="23" y="104" width="9" height="9"/>
      <rect x="36" y="104" width="9" height="9"/>
    </g>
  </g>
</svg>
`.trim();

// OG Image 1200x630 SVG
const ogImageSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#222220"/>
      <stop offset="100%" stop-color="#0e0e0e"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2CF8D"/>
      <stop offset="100%" stop-color="#C59A4E"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Border accent -->
  <rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="#E5BC75" stroke-opacity="0.25" stroke-width="2"/>

  <!-- Gold Emblem on the left/center -->
  <g fill="url(#goldGrad)" transform="translate(140, 165) scale(2.4)">
    <g transform="translate(10, 0)">
      <path d="M14 11 L18 1 H51 V55 H42 V11 Z"/>
      <path d="M4 28 L8 18 H35 V55 H25 V28 Z"/>
      <path d="M63 11 L69 1 H104 V124 H95 V11 Z"/>
      <path d="M63 28 L68 18 H86 V124 H79 V28 Z"/>
      <path d="M0 63 H68 L63 72 H5 Z"/>
      <path d="M4 76 H64 L59 85 H9 Z"/>
      <path d="M9 89 H59 L54 98 H14 Z"/>
      <rect x="23" y="104" width="9" height="9"/>
      <rect x="36" y="104" width="9" height="9"/>
    </g>
  </g>

  <!-- Brand Typography -->
  <g transform="translate(500, 210)" font-family="system-ui, -apple-system, sans-serif">
    <!-- Eyebrow -->
    <text x="0" y="0" fill="#E5BC75" font-size="18" font-weight="800" letter-spacing="4">BANGLADESH'S NO. 1 JERSEY VAULT</text>
    
    <!-- Title -->
    <text x="0" y="70" fill="#FFFFFF" font-size="64" font-weight="900" letter-spacing="-1">ELEVEN NATION</text>
    
    <!-- Subtitle -->
    <text x="0" y="125" fill="#E5BC75" font-size="28" font-weight="700" letter-spacing="1">PREMIUM FOOTBALL JERSEYS &amp; KITS</text>
    
    <!-- Highlights -->
    <text x="0" y="180" fill="#A0A0A0" font-size="20" font-weight="500">Player Editions • Fan Editions • Retro Classics • Custom Printing</text>

    <!-- Bottom URL & badge -->
    <rect x="0" y="220" width="310" height="42" rx="10" fill="#E5BC75"/>
    <text x="24" y="248" fill="#111111" font-size="18" font-weight="900" letter-spacing="1">WWW.ELEVENNATION.SHOP</text>
  </g>
</svg>
`.trim();

function buildIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffsetBase = headerSize + count * dirEntrySize;

  let currentOffset = dataOffsetBase;
  const entries = [];

  for (const item of pngBuffers) {
    entries.push({
      width: item.width >= 256 ? 0 : item.width,
      height: item.height >= 256 ? 0 : item.height,
      colorCount: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      bytesInRes: item.buffer.length,
      imageOffset: currentOffset,
      buffer: item.buffer,
    });
    currentOffset += item.buffer.length;
  }

  const totalLength = currentOffset;
  const out = Buffer.alloc(totalLength);

  // Write header
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // 1 = ICO
  out.writeUInt16LE(count, 4); // image count

  // Write directory entries
  let offset = headerSize;
  for (const e of entries) {
    out.writeUInt8(e.width, offset);
    out.writeUInt8(e.height, offset + 1);
    out.writeUInt8(e.colorCount, offset + 2);
    out.writeUInt8(e.reserved, offset + 3);
    out.writeUInt16LE(e.planes, offset + 4);
    out.writeUInt16LE(e.bitCount, offset + 6);
    out.writeUInt32LE(e.bytesInRes, offset + 8);
    out.writeUInt32LE(e.imageOffset, offset + 12);
    offset += dirEntrySize;
  }

  // Write image buffers
  for (const e of entries) {
    e.buffer.copy(out, e.imageOffset);
  }

  return out;
}

async function run() {
  console.log('Generating favicons and images...');
  const svgBuffer = Buffer.from(iconSvg512);

  // 1. Generate PNGs
  const [b16, b32, b48, b180, b192, b512, ogImageBuffer] = await Promise.all([
    sharp(svgBuffer).resize(16, 16).png().toBuffer(),
    sharp(svgBuffer).resize(32, 32).png().toBuffer(),
    sharp(svgBuffer).resize(48, 48).png().toBuffer(),
    sharp(svgBuffer).resize(180, 180).png().toBuffer(),
    sharp(svgBuffer).resize(192, 192).png().toBuffer(),
    sharp(svgBuffer).resize(512, 512).png().toBuffer(),
    sharp(Buffer.from(ogImageSvg)).resize(1200, 630).png().toBuffer(),
  ]);

  // Write standalone PNG files
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), b32);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), b48);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), b180);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), b192);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), b512);
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogImageBuffer);

  // 2. Generate multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = buildIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  console.log('All favicons, favicon.ico and og-image.png generated successfully!');
}

run().catch((err) => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
