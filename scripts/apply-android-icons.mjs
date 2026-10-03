import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const candidates = [
    path.resolve('public', 'bolao_logo_app.png'),
    path.resolve('src', 'assets', 'images', 'bolao_logo_app.png'),
    path.resolve('public', 'bolao_logo.png'),
    path.resolve('public', 'icon2.png')
  ];

  const iconSrc = candidates.find(p => fs.existsSync(p));
  const resDir = path.resolve('android', 'app', 'src', 'main', 'res');

  if (!iconSrc) {
    console.error('Source icon not found in any candidate path.');
    return;
  }

  console.log('Using source icon:', iconSrc);

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping icon generation until android platform is added.');
    return;
  }

  const sizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use fallback copying.');
  }

  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      await sharp(iconSrc)
        .resize(item.fgSize, item.fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
    }
  }

  // Generate notification small icon (ic_stat_icon.png) with transparent cutout for Android status bar
  // and full-color notification icon (ic_launcher.png in drawable)
  const statIconSizes = [
    { dir: 'drawable', size: 48 },
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 }
  ];

  for (const item of statIconSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      // Create silhouette with transparent background so Android status bar shows the actual logo details
      const { data, info } = await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const out = Buffer.alloc(data.length);
      const center = item.size / 2;
      const maxRadius = center * 0.94;

      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const idx = (y * info.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const dx = x - center + 0.5;
          const dy = y - center + 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Luminance of pixel
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Keep colored/dark elements of the logo (clover, BOLÃO text, outer ring) opaque white,
          // and make white background & outside circle transparent so Android status bar renders the logo clearly
          if (a > 50 && dist <= maxRadius && lum < 218) {
            out[idx] = 255;
            out[idx + 1] = 255;
            out[idx + 2] = 255;
            out[idx + 3] = 255;
          } else {
            out[idx] = 0;
            out[idx + 1] = 0;
            out[idx + 2] = 0;
            out[idx + 3] = 0;
          }
        }
      }

      await sharp(out, {
        raw: { width: info.width, height: info.height, channels: 4 }
      })
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_icon.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
    }
  }

  const drawableDirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'];
  for (const d of drawableDirs) {
    const dPath = path.join(resDir, d);
    if (fs.existsSync(dPath)) {
      fs.copyFileSync(iconSrc, path.join(dPath, 'splash.png'));
    }
  }

  console.log('✅ Android icons & notification small icons successfully injected!');
}

generateIcons().catch(console.error);
