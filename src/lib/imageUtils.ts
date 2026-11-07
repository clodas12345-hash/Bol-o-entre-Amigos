/**
 * Utilitários para processamento e compressão de imagens no cliente (browser).
 */

/**
 * Comprime uma imagem utilizando o Canvas API para garantir que o tamanho do Base64
 * seja compatível com os limites do Firestore (1MB) e melhore a velocidade de upload.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não for imagem, retorna o erro
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensiona mantendo a proporção se for maior que o limite
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto do canvas.'));
          return;
        }

        // Desenha a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como JPEG comprimido
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Verifica o tamanho aproximado de uma string Base64 em bytes.
 */
export function getBase64Size(base64String: string): number {
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  return (base64String.length * 3) / 4 - padding;
}
