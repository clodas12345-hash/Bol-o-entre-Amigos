import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro de renderização capturado:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    window.location.href = window.location.origin + '?reset=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-slate-100 mb-2">
              Bolo Amigos - Recuperação do App
            </h1>

            <p className="text-sm text-slate-300 mb-6">
              O aplicativo encontrou uma falha de exibição temporária. Clique no botão abaixo para recarregar com segurança.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
                Recarregar Aplicativo
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition border border-slate-600 text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache e Reiniciar
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left border-t border-slate-700 pt-4">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200 font-mono">
                  Detalhes do erro técnico
                </summary>
                <pre className="mt-2 p-3 bg-slate-950 rounded-lg text-[11px] text-red-300 overflow-x-auto font-mono max-h-40 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
