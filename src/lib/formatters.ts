import { useState, useEffect } from 'react';

/**
 * Formata um nome completo ou e-mail para exibir apenas o Primeiro e o Último nome.
 * Exemplos:
 *  - "Claudio Jose de Oliveira" -> "Claudio Oliveira"
 *  - "Ciene" -> "Ciene"
 *  - "Maria dos Santos Silva" -> "Maria Silva"
 *  - "usuario@gmail.com" -> "usuario"
 */
export function formatFirstAndLastName(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'Sem nome';

  // Se for um endereço de e-mail puro
  const cleaned = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'Sem nome';
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const last = parts[parts.length - 1];

  return `${first} ${last}`;
}

/**
 * Normaliza o telefone garantindo o DDI 55 (Brasil) para o WhatsApp.
 * Evita que o DDD 11 seja interpretado pelo WhatsApp como código de país +1 (EUA).
 */
export function normalizeBrazilianPhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // Se já tiver DDI 55 e tamanho de 12 ou 13 dígitos (ex: 5511999998888 ou 551188887777)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se o usuário digitou DDD + número (10 ou 11 dígitos, ex: 11999998888)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se não começar com 55, adiciona o DDI Brasil 55 por padrão
  if (!digits.startsWith('55')) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Formata visualmente o número de telefone no padrão brasileiro: (11) 99999-8888
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return phone;

  // Se tiver 55 no início, remove para exibição limpa de DDD + número
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(cpf?: string | null): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formata qualquer valor de data (string ISO YYYY-MM-DD, DD/MM/YYYY, Date ou Timestamp do Firestore)
 * obrigatoriamente para o padrão brasileiro DD/MM/AAAA.
 */
export function formatAnyDateBR(dateVal: any): string {
  if (!dateVal) return '';

  let d: Date | null = null;

  if (typeof dateVal.toDate === 'function') {
    d = dateVal.toDate();
  } else if (typeof dateVal === 'object' && typeof dateVal.seconds === 'number') {
    d = new Date(dateVal.seconds * 1000);
  } else if (typeof dateVal === 'object' && typeof dateVal._seconds === 'number') {
    d = new Date(dateVal._seconds * 1000);
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return '';

    // Se for YYYY-MM-DD ou ISO com T
    const datePart = trimmed.split('T')[0].split(' ')[0];
    if (datePart.includes('-')) {
      const parts = datePart.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        } else if (parts[2].length === 4) {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
      }
    }

    // Se for com barra (DD/MM/YYYY ou YYYY/MM/DD ou MM/DD/YYYY)
    if (datePart.includes('/')) {
      const parts = datePart.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        }
        const p0 = Number(parts[0]);
        const p1 = Number(parts[1]);
        const yearStr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        // Se o segundo número for > 12 (ex: 10/25/2026), veio em formato americano MM/DD/YYYY
        if (p1 > 12 && p0 <= 12) {
          return `${String(p1).padStart(2, '0')}/${String(p0).padStart(2, '0')}/${yearStr}`;
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${yearStr}`;
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      return trimmed;
    }
  }

  if (d && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return String(dateVal);
}

export function getAppPublicUrl(): string {
  const PUBLIC_SHARED_URL = 'https://ais-pre-huai57g7b5d2yat2qnjukg-473118395752.us-west2.run.app';
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
    // Nunca retorna ais-dev para links compartilhados no WhatsApp, pois o ais-dev exige "Cookie check" de autenticação do AI Studio
    if (window.location.origin.includes('ais-dev-')) {
      return window.location.origin.replace('ais-dev-', 'ais-pre-');
    }
    return window.location.origin;
  }
  return PUBLIC_SHARED_URL;
}

export function getVisitorPortalUrl(): string {
  return `${getAppPublicUrl()}/visitante`;
}

export function getParticipantPortalUrl(): string {
  return getAppPublicUrl();
}

/**
 * Monta URL oficial da API do WhatsApp preservando UTF-8 (evita que emojis virem losangos "" no Android)
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const fullNumber = normalizeBrazilianPhoneDigits(phone);
  const encodedText = encodeURIComponent(message);
  if (!fullNumber) {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodedText}`;
}

/**
 * Gera o link do WhatsApp com valor exato das cotas e chave PIX cadastrada.
 */
export function getWhatsAppCobrarUrl(
  phone: string | null | undefined,
  name: string,
  quotas = 1,
  unitPrice = 20.00,
  pixKey = '11953292570'
): string {
  const firstName = name.trim().split(' ')[0] || 'Participante';
  const totalAmount = (quotas * unitPrice).toFixed(2).replace('.', ',');
  const quotasText = quotas > 1 ? `${quotas} cotas (R$ ${totalAmount})` : `1 cota (R$ ${totalAmount})`;

  const message = `🍀 *Bolão entre Amigos*\n\nOlá ${firstName}, tudo bem? Passando para lembrar da sua participação no *Bolão entre Amigos*.\nVocê possui *${quotasText}* em aberto.\n\n*Chave PIX (Celular):* ${pixKey}\n*Valor Total:* R$ ${totalAmount}\n\nApós realizar o PIX, envie o comprovante pelo link:\n${getAppPublicUrl()}/upload-receipt`;

  return buildWhatsAppUrl(phone, message);
}

export function useResponsiveLayout(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return {
    isMobile,
    isTablet: windowWidth >= breakpoint && windowWidth < 1024,
    isDesktop: windowWidth >= 1024,
    windowWidth,
    compactCardClass: isMobile ? 'p-2.5 text-xs rounded-xl space-y-2' : 'p-4 rounded-2xl space-y-4',
    compactTableClass: isMobile ? 'text-[11px] p-1.5' : 'text-sm p-3',
  };
}

export interface GameDataSchema {
  numbers: number[];
  contest?: number | string;
  cost?: number;
  userId?: string;
  [key: string]: any;
}

export interface ContestDataSchema {
  contest: number | string;
  numbers: number[];
  date?: string;
  [key: string]: any;
}

export function validateGameSchema(game: any): { isValid: boolean; error?: string } {
  if (!game || typeof game !== 'object') {
    return { isValid: false, error: 'Objeto de jogo inválido ou nulo.' };
  }
  
  if (!Array.isArray(game.numbers)) {
    return { isValid: false, error: 'O jogo deve conter um array de dezenas (numbers).' };
  }

  if (game.numbers.length < 15 || game.numbers.length > 20) {
    return { isValid: false, error: `Quantidade de dezenas inválida (${game.numbers.length}). A Lotofácil exige entre 15 e 20 dezenas.` };
  }

  const unique = new Set(game.numbers);
  if (unique.size !== game.numbers.length) {
    return { isValid: false, error: 'O jogo contém dezenas duplicadas.' };
  }

  for (const n of game.numbers) {
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 25) {
      return { isValid: false, error: `Dezena fora do intervalo válido da Lotofácil (1-25): ${n}` };
    }
  }

  return { isValid: true };
}

export function validateContestSchema(contestObj: any): { isValid: boolean; error?: string } {
  if (!contestObj || typeof contestObj !== 'object') {
    return { isValid: false, error: 'Objeto de concurso inválido ou nulo.' };
  }

  const contestNum = Number(contestObj.contest);
  if (isNaN(contestNum) || contestNum <= 0) {
    return { isValid: false, error: `Numeração de concurso inválida: ${contestObj.contest}` };
  }

  if (!Array.isArray(contestObj.numbers)) {
    return { isValid: false, error: 'O concurso deve conter um array de números sorteados.' };
  }

  if (contestObj.numbers.length !== 15) {
    return { isValid: false, error: `Quantidade de números do concurso inválida (${contestObj.numbers.length}). A Lotofácil possui exatamente 15 números sorteados.` };
  }

  for (const n of contestObj.numbers) {
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 25) {
      return { isValid: false, error: `Número sorteado inválido da Lotofácil (1-25): ${n}` };
    }
  }

  return { isValid: true };
}

export function validateDataSchema(data: any, type: 'game' | 'contest'): { isValid: boolean; error?: string } {
  if (type === 'game') {
    return validateGameSchema(data);
  } else if (type === 'contest') {
    return validateContestSchema(data);
  }
  return { isValid: false, error: 'Tipo de validação desconhecido.' };
}

