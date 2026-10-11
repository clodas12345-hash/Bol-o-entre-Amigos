import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lotofacil.gestor',
  appName: 'Bolão Amigos',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      sound: 'default'
    }
  }
};

export default config;
