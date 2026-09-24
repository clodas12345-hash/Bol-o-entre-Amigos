import QRCode from 'qrcode';

export interface PixConfig {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  defaultAmount: number; // Ex: 20.00 por cota
  infoMessage?: string;
}

export const DEFAULT_PIX_CONFIG: PixConfig = {
  keyType: 'phone',
  pixKey: '11953292570',
  receiverName: 'ADMIN DO BOLAO',
  receiverCity: 'SAO PAULO',
  defaultAmount: 20.00,
  infoMessage: 'Cota do Bolao Lotofacil',
};

// Formata campos TLV (Tag-Length-Value) do padrão EMVCo do Banco Central do Brasil
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Cálculo CRC-16 CCITT (Polinômio 0x1021)
function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Remove acentuação e caracteres especiais para compatibilidade bancária
function sanitizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

/**
 * Formata a chave PIX para o payload do Banco Central
 */
function formatPixKeyForPayload(key: string, keyType: PixConfig['keyType']): string {
  const raw = key.trim();
  if (keyType === 'phone') {
    let digits = raw.replace(/\D/g, '');
    if (!digits.startsWith('55')) {
      digits = `55${digits}`;
    }
    return `+${digits}`;
  }
  if (keyType === 'cpf' || keyType === 'cnpj') {
    return raw.replace(/\D/g, '');
  }
  return raw;
}

/**
 * Gera o código Copia e Cola oficial do PIX (Padrão Banco Central)
 */
export function generatePixPayload(config: PixConfig, amount?: number, txId = '***'): string {
  const formattedKey = formatPixKeyForPayload(config.pixKey, config.keyType);
  const name = sanitizeString(config.receiverName || 'ADMIN').slice(0, 25);
  const city = sanitizeString(config.receiverCity || 'SAO PAULO').slice(0, 15);
  const finalAmount = amount !== undefined && amount > 0 ? amount : config.defaultAmount;

  // 00: Payload Format Indicator
  let payload = formatTLV('00', '01');

  // 26: Merchant Account Information - Pix
  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const pixKeyField = formatTLV('01', formattedKey);
  const desc = config.infoMessage ? formatTLV('02', config.infoMessage.slice(0, 50)) : '';
  const merchantAccountInfo = `${gui}${pixKeyField}${desc}`;
  payload += formatTLV('26', merchantAccountInfo);

  // 52: Merchant Category Code
  payload += formatTLV('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatTLV('53', '986');

  // 54: Transaction Amount
  if (finalAmount && finalAmount > 0) {
    payload += formatTLV('54', finalAmount.toFixed(2));
  }

  // 58: Country Code
  payload += formatTLV('58', 'BR');

  // 59: Merchant Name
  payload += formatTLV('59', name || 'ADMIN');

  // 60: Merchant City
  payload += formatTLV('60', city || 'SAO PAULO');

  // 62: Additional Data Field (TxID)
  const txIdField = formatTLV('05', txId);
  payload += formatTLV('62', txIdField);

  // 63: CRC16
  payload += '6304';
  const checksum = crc16(payload);
  
  return `${payload}${checksum}`;
}

/**
 * Gera a imagem do QR Code em Base64 Data URL
 */
export async function generatePixQrCode(pixPayload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(pixPayload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao gerar QR code PIX:', err);
    return '';
  }
}
