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

  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use fallback copying.');
  }

  // Pre-trim the excess white margin around bolao_logo_app.png so the logo fills the icon area
  let trimmedBuffer = null;
  if (sharp) {
    try {
      trimmedBuffer = await sharp(iconSrc)
        .trim({ threshold: 25 })
        .png()
        .toBuffer();
    } catch (trimErr) {
      trimmedBuffer = await sharp(iconSrc).png().toBuffer();
    }
  }

  /**
   * Generates a monochrome white silhouette (#FFFFFF) with transparent background
   * from the current app logo, as required by Android for status bar smallIcon (ic_stat_icon.png).
   */
  async function createMonochromeSilhouetteBuffer(size) {
    const { data, info } = await sharp(trimmedBuffer || iconSrc)
      .resize(size, size, { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const out = Buffer.alloc(data.length);
    const center = size / 2;
    const outerRadius = center * 0.96;
    const ringInnerRadius = center * 0.83;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const dx = x - center + 0.5;
        const dy = y - center + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        let alpha = 0;
        if (dist <= outerRadius && dist >= ringInnerRadius) {
          // Outer emblem ring in white
          alpha = 255;
        } else if (dist < ringInnerRadius * 0.92 && lum < 222) {
          // Interior logo silhouette (clover/cards + BOLÃO + GKD) in white with smooth edges
          alpha = Math.min(255, Math.max(90, Math.round((225 - lum) * 2.5)));
        }

        if (alpha > 0) {
          out[idx] = 255;     // R = White
          out[idx + 1] = 255; // G = White
          out[idx + 2] = 255; // B = White
          out[idx + 3] = alpha;
        } else {
          out[idx] = 0;
          out[idx + 1] = 0;
          out[idx + 2] = 0;
          out[idx + 3] = 0;
        }
      }
    }

    return sharp(out, {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png()
      .toBuffer();
  }

  // Also save a master public/ic_stat_icon.png (96x96)
  if (sharp) {
    const publicStatBuf = await createMonochromeSilhouetteBuffer(96);
    await fs.promises.writeFile(path.resolve('public', 'ic_stat_icon.png'), publicStatBuf);
  }

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping res/ icon generation.');
    return;
  }

  const mipmapSizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108, statSize: 24 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162, statSize: 36 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216, statSize: 48 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324, statSize: 72 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432, statSize: 96 }
  ];

  for (const item of mipmapSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      await sharp(trimmedBuffer || iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await sharp(trimmedBuffer || iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      await sharp(trimmedBuffer || iconSrc)
        .resize(item.fgSize, item.fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

      // Also save ic_stat_icon.png in mipmap-* densities
      const statBuf = await createMonochromeSilhouetteBuffer(item.statSize);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_stat_icon.png'), statBuf);
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
    }
  }

  // Generate monochrome notification small icon (ic_stat_icon.png) across all drawable densities
  const drawableStatSizes = [
    { dir: 'drawable', size: 48 },
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 }
  ];

  for (const item of drawableStatSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      const statBuf = await createMonochromeSilhouetteBuffer(item.size);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_stat_icon.png'), statBuf);
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

  console.log('✅ Monochrome silhouette ic_stat_icon.png generated across all drawable and mipmap densities!');
}

generateIcons().catch(console.error);
