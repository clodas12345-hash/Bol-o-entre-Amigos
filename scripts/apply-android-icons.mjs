import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const candidates = [
    path.resolve('src', 'assets', 'images', 'bolao_logo_app.png'),
    path.resolve('public', 'bolao_logo.jpg'),
    path.resolve('public', 'bolao_logo_app.png'),
    path.resolve('public', 'bolao_logo.png')
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

  // Extract the exact logo artwork without excess margins so we can scale it precisely
  // to fit inside Android's circular notification & adaptive icon masks without clipping "BOLÃO" or "GKD"
  let trimmedBuffer = null;
  if (sharp) {
    try {
      trimmedBuffer = await sharp(iconSrc)
        .trim({ threshold: 25 })
        .png()
        .toBuffer();
    } catch (err) {
      trimmedBuffer = await sharp(iconSrc).png().toBuffer();
    }
  }

  /**
   * Creates a real-color icon where the logo occupies `scaleRatio` (e.g. 0.66) of the total canvas,
   * centered on a clean white background so Android/One UI circular masks never cut off the edges.
   */
  async function createFittedColorIcon(canvasSize, scaleRatio = 0.66) {
    const innerSize = Math.max(16, Math.round(canvasSize * scaleRatio));
    const resizedLogo = await sharp(trimmedBuffer || iconSrc)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    const padTop = Math.floor((canvasSize - innerSize) / 2);
    const padBottom = canvasSize - innerSize - padTop;
    const padLeft = Math.floor((canvasSize - innerSize) / 2);
    const padRight = canvasSize - innerSize - padLeft;

    return sharp(resizedLogo)
      .extend({
        top: padTop,
        bottom: padBottom,
        left: padLeft,
        right: padRight,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
  }

  // Update public/ic_stat_icon.png with the properly fitted icon
  if (sharp) {
    const publicFitted = await createFittedColorIcon(512, 0.66);
    await fs.promises.writeFile(path.resolve('public', 'ic_stat_icon.png'), publicFitted);
  }

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping res/ icon generation.');
    return;
  }

  const mipmapSizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  for (const item of mipmapSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      // 0.66 scale ensures 100% of the logo (LOTOFÁCIL, BOLÃO, GKD MOBILITY) stays inside Android's circular mask
      const launcherBuf = await createFittedColorIcon(item.size, 0.66);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher.png'), launcherBuf);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher_round.png'), launcherBuf);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_stat_icon.png'), launcherBuf);

      // Android Adaptive Icon foreground (108dp canvas where only central 66dp circle is visible -> 0.58 scale)
      const fgBuf = await createFittedColorIcon(item.fgSize, 0.58);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher_foreground.png'), fgBuf);
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
    }
  }

  // Generate fitted notification icons across all drawable densities
  const drawableSizes = [
    { dir: 'drawable', size: 192 },
    { dir: 'drawable-mdpi', size: 48 },
    { dir: 'drawable-hdpi', size: 72 },
    { dir: 'drawable-xhdpi', size: 96 },
    { dir: 'drawable-xxhdpi', size: 144 },
    { dir: 'drawable-xxxhdpi', size: 192 }
  ];

  for (const item of drawableSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      const statBuf = await createFittedColorIcon(item.size, 0.66);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_stat_icon.png'), statBuf);
      await fs.promises.writeFile(path.join(targetFolder, 'ic_launcher.png'), statBuf);
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
    }
  }

  const drawableDirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'];
  for (const d of drawableDirs) {
    const dPath = path.join(resDir, d);
    if (fs.existsSync(dPath)) {
      fs.copyFileSync(iconSrc, path.join(dPath, 'splash.png'));
    }
  }

  console.log('✅ Properly fitted real-color icons generated across all mipmap and drawable folders (no clipped edges)!');
}

generateIcons().catch(console.error);
