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

  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use fallback copying.');
  }

  // Pre-trim the excess white margin around bolao_logo_app.png so the circular logo fills the icon
  let trimmedBuffer = null;
  if (sharp) {
    try {
      trimmedBuffer = await sharp(iconSrc)
        .trim({ threshold: 25 })
        .png()
        .toBuffer();
    } catch (trimErr) {
      console.warn('Could not trim icon, using original:', trimErr);
      trimmedBuffer = await sharp(iconSrc).png().toBuffer();
    }
  }

  // Helper to create a circular full-color PNG buffer of a given size
  async function createCircularColorIcon(size) {
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/>
      </svg>`
    );

    const resized = await sharp(trimmedBuffer || iconSrc)
      .resize(size, size, { fit: 'cover' })
      .ensureAlpha()
      .png()
      .toBuffer();

    return sharp(resized)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  const sizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      const circularBuf = await createCircularColorIcon(item.size);

      await sharp(trimmedBuffer || iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher_round.png'), circularBuf);

      const fgLogoSize = Math.round(item.fgSize * 0.68);
      const fgPad = Math.floor((item.fgSize - fgLogoSize) / 2);
      const circularFg = await createCircularColorIcon(fgLogoSize);

      await sharp(circularFg)
        .extend({
          top: fgPad,
          bottom: item.fgSize - fgLogoSize - fgPad,
          left: fgPad,
          right: item.fgSize - fgLogoSize - fgPad,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
    }
  }

  // Generate notification icons in drawable* folders!
  // IMPORTANT: Capacitor's LocalNotification.kt looks in "drawable" for BOTH smallIcon AND largeIcon!
  const statIconSizes = [
    { dir: 'drawable', size: 96, largeSize: 192 },
    { dir: 'drawable-mdpi', size: 24, largeSize: 64 },
    { dir: 'drawable-hdpi', size: 36, largeSize: 96 },
    { dir: 'drawable-xhdpi', size: 48, largeSize: 128 },
    { dir: 'drawable-xxhdpi', size: 72, largeSize: 192 },
    { dir: 'drawable-xxxhdpi', size: 96, largeSize: 256 }
  ];

  for (const item of statIconSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      // 1. Save full-color circular logo as ic_launcher.png inside drawable* so largeIcon: 'ic_launcher' works!
      const largeColorBuf = await createCircularColorIcon(item.largeSize);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher.png'), largeColorBuf);

      // 2. Create crisp silhouette with transparent background for smallIcon: 'ic_stat_icon'
      const { data, info } = await sharp(trimmedBuffer || iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const out = Buffer.alloc(data.length);
      const center = item.size / 2;
      const outerRadius = center * 0.96;
      const ringInnerRadius = center * 0.82;

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
          const isOuterRing = dist <= outerRadius && dist >= ringInnerRadius;
          const isInteriorGraphic = dist < ringInnerRadius * 0.92 && lum < 225;

          if (isOuterRing || isInteriorGraphic) {
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
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
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

  console.log('✅ Android icons, drawable/ic_launcher.png (largeIcon) & drawable/ic_stat_icon.png (smallIcon) successfully injected!');
}

generateIcons().catch(console.error);
