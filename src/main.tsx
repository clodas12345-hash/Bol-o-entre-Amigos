import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';
import { ToastProvider } from './components/NotificationManager';

// Detecta se está rodando no aplicativo nativo Android/iOS (Capacitor ou WebView APK)
// para reservar espaço da barra superior (relógio/rede/bateria) e dos botões nativos inferiores
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /;\s*wv\)/i.test(ua) || (ua.includes('Android') && ua.includes('Version/'));
  if (Capacitor.isNativePlatform() || isAndroidWebView) {
    document.documentElement.classList.add('is-native-app');
  }
}

// Proteção global contra desvios de tela no AI Studio:
// Intercepta erros não capturados e rejeições de Promise para que a plataforma AI Studio
// não troque a aba de "Preview" para "Chat" inesperadamente.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('[App Barrier] Erro de janela interceptado com segurança:', event.message || event);
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[App Barrier] Promessa rejeitada interceptada com segurança:', event.reason);
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);

