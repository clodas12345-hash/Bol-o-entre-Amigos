import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/NotificationManager';

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

