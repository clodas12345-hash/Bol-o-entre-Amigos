import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lotofacil.gestor',
  appName: 'Bolão Amigos',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#34d399',
      sound: 'default'
    }
  }
};

export default config;
