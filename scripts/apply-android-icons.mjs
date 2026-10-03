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

  console.log('Using real-color, real-size source icon:', iconSrc);

  // Sync public/bolao_logo_app.png and public/ic_stat_icon.png with the real-size, real-color icon
  try {
    fs.copyFileSync(iconSrc, path.resolve('public', 'bolao_logo_app.png'));
    fs.copyFileSync(iconSrc, path.resolve('public', 'ic_stat_icon.png'));
  } catch (err) {
    console.warn('Could not sync public icons:', err);
  }

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping res/ icon generation.');
    return;
  }

  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use direct file copying.');
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
      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      await sharp(iconSrc)
        .resize(item.fgSize, item.fgSize, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_icon.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
    }
  }

  // Generate real-color, real-size notification icons across all drawable densities
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
      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_icon.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'cover' })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));
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

  console.log('✅ Real-color, real-size icons generated across all mipmap and drawable folders!');
}

generateIcons().catch(console.error);
