import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface FileDownloadOptions {
  fileName: string;
  content: string; // Text content (JSON, CSV, etc.) or base64
  mimeType?: string;
  isBase64?: boolean;
}

/**
 * Converte um Blob para base64 puro (sem o prefixo data:...)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva ou baixa um arquivo de forma universal e compatível com:
 * 1. Android APK nativo (Capacitor WebView) -> grava no armazenamento e abre diálogo nativo para Salvar/Compartilhar (Downloads, Drive, WhatsApp, etc.)
 * 2. Navegador Web (Desktop / Mobile) -> dispara download tradicional via Blob e <a download>
 */
export async function downloadOrShareFile(options: FileDownloadOptions): Promise<{
  success: boolean;
  method: 'native' | 'browser';
  message?: string;
}> {
  const { fileName, content, mimeType = 'application/json', isBase64 = false } = options;
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      // 1. Grava no diretório Cache / Documents do app Android
      let fileUri: string = '';

      if (isBase64) {
        const writeRes = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Cache
        });
        fileUri = writeRes.uri;
      } else {
        const writeRes = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        fileUri = writeRes.uri;
      }

      // Também grava uma cópia permanente no Documents
      try {
        if (isBase64) {
          await Filesystem.writeFile({
            path: fileName,
            data: content,
            directory: Directory.Documents
          });
        } else {
          await Filesystem.writeFile({
            path: fileName,
            data: content,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });
        }
      } catch (docErr) {
        console.warn('Aviso ao salvar cópia em Documents:', docErr);
      }

      // 2. Aciona o compartilhamento nativo do Android com o arquivo anexado
      // Isso permite ao usuário escolher "Salvar no dispositivo", "Downloads", "Google Drive", "WhatsApp", etc.
      try {
        await Share.share({
          title: fileName,
          text: `Backup dos dados do Bolão: ${fileName}`,
          url: fileUri,
          dialogTitle: 'Salvar ou Compartilhar Arquivo de Backup'
        });
      } catch (shareErr: any) {
        // Se o usuário fechar a tela de compartilhamento sem escolher, não é um erro fatal
        console.log('Diálogo de compartilhamento finalizado:', shareErr);
      }

      return {
        success: true,
        method: 'native',
        message: 'Arquivo salvo com sucesso no dispositivo!'
      };
    } catch (err: any) {
      console.error('Erro ao salvar arquivo no Android via Filesystem:', err);
      // Tenta fallback para navegador
    }
  }

  // Fallback / Navegador Web:
  try {
    let blob: Blob;
    if (isBase64) {
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      blob = new Blob([content], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoga a URL com segurança após 60s para não cancelar o download
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 60000);

    return {
      success: true,
      method: 'browser',
      message: 'Download iniciado no navegador.'
    };
  } catch (browserErr: any) {
    console.error('Erro ao baixar arquivo no navegador:', browserErr);
    throw new Error('Não foi possível realizar o download do arquivo.');
  }
}
