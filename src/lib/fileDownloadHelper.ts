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
 * Esquema de backup solicitado pelo usuário:
 * - Em plataforma nativa (Android/iOS com Capacitor): Grava o arquivo na pasta Documentos e abre o pop-up de Compartilhar/Salvar (Share.share).
 * - Em navegador Web: Dispara download via Blob e <a download>.
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
      let fileUri = '';
      if (isBase64) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Documents
        });
        fileUri = result.uri;
      } else {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        fileUri = result.uri;
      }

      // Abre o menu de compartilhamento do Android para salvar no Google Drive, WhatsApp ou onde preferir
      await Share.share({
        title: 'Backup Completo Bolão de Amigos',
        text: 'Arquivo completo de backup com todos os dados do bolão.',
        url: fileUri,
        dialogTitle: 'Salvar ou Compartilhar Backup'
      });

      return {
        success: true,
        method: 'native',
        message: 'Backup gerado com sucesso!'
      };
    } catch (err: any) {
      console.error('Erro ao salvar no celular:', err);
    }
  }

  // Navegador Web
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
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = fileName;
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

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
