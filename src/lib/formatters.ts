import { useState, useEffect } from 'react';

/**
 * Formata um nome completo ou e-mail para exibir apenas o Primeiro e o Último nome.
 * Exemplos:
 *  - "Claudio Jose de Oliveira" -> "Claudio Oliveira"
 *  - "Ciene" -> "Ciene"
 *  - "Maria dos Santos Silva" -> "Maria Silva"
 *  - "usuario@gmail.com" -> "usuario"
 */
export function formatFirstAndLastName(input?: any, fallback = 'Participante'): string {
  if (!input) return fallback;

  let nameOrEmail = input;
  if (typeof input === 'object' && input !== null) {
    nameOrEmail = input.displayName || input.name || input.userName || input.memberName || input.email || '';
  }

  if (!nameOrEmail || typeof nameOrEmail !== 'string') return fallback;

  // Remove marcações de função/ambiente em parênteses como (Admin), (Preview), (Participante)
  const withoutParens = String(nameOrEmail).replace(/\([^)]*\)/gi, '').trim();

  // Se for um endereço de e-mail puro
  const cleaned = withoutParens.includes('@') ? withoutParens.split('@')[0] : withoutParens;
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const last = parts[parts.length - 1];

  return `${first} ${last}`;
}

/**
 * Determina se um participante estava ativo em um determinado mês de referência (MM/AAAA).
 * Se o participante foi excluído/desativado do grupo:
 *  - Não aparece no mês atual nem nas listas dos próximos meses.
 *  - Permanece visível nas listas dos meses anteriores para manter o histórico antigo intacto.
 */
export function isMemberActiveInMonth(member: any, targetMonthStr?: string): boolean {
  if (!member) return false;

  const now = new Date();
  const currentMonthStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const monthToTest = targetMonthStr || currentMonthStr;

  const isExplicitlyInactive = member.active === false || member.status === 'inativo' || member.archived === true;

  if (!isExplicitlyInactive) {
    return true;
  }

  // Se o membro possui mês de remoção registrado (ex: 11/2026)
  if (member.removedMonth && monthToTest) {
    const [targetM, targetY] = monthToTest.split('/').map(Number);
    const [remM, remY] = member.removedMonth.split('/').map(Number);

    if (targetY && targetM && remY && remM) {
      const targetVal = targetY * 12 + targetM;
      const remVal = remY * 12 + remM;
      // Se o mês testado for estritamente anterior ao mês de remoção, o membro estava ativo e deve ser exibido!
      return targetVal < remVal;
    }
  }

  return false;
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
  // Ajustado conforme solicitação: o link de retorno deve ter DEV e NUNCA PRE, salvo na memória
  const DEFAULT_DEV_URL = 'https://ais-dev-huai57g7b5d2yat2qnjukg-473118395752.us-west2.run.app';
  try {
    if (typeof window !== 'undefined') {
      let origin = window.location.origin || '';
      if (origin.includes('ais-pre-')) {
        origin = origin.replace('ais-pre-', 'ais-dev-');
      }
      if (origin.includes('.run.app') && !origin.includes('localhost')) {
        localStorage.setItem('bolao_app_public_url', origin);
        return origin;
      }
      const saved = localStorage.getItem('bolao_app_public_url');
      if (saved) {
        return saved.replace('ais-pre-', 'ais-dev-');
      }
      localStorage.setItem('bolao_app_public_url', DEFAULT_DEV_URL);
    }
  } catch {}
  return DEFAULT_DEV_URL;
}

export function getVisitorPortalUrl(): string {
  const base = getAppPublicUrl().replace(/\/$/, '');
  return `${base}/visitante?view=true`;
}

export function getReceiptUploadUrl(name?: string | null, phone?: string | null): string {
  const base = getAppPublicUrl().replace(/\/$/, '');
  const params = new URLSearchParams();
  const safeName = String(name || '').trim();
  const safePhone = String(phone || '').trim();
  if (safeName) params.set('nome', safeName);
  if (safePhone) params.set('tel', safePhone);
  const queryString = params.toString();
  return `${base}/upload-receipt${queryString ? '?' + queryString : ''}`;
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
  name?: string | null,
  quotas = 1,
  unitPrice = 20.00,
  pixKey = '11953292570',
  pendingMonths: string[] = []
): string {
  const safeName = String(name || '').trim();
  const firstName = (safeName ? safeName.split(' ')[0] : 'Participante') || 'Participante';
  const totalQuotasToCharge = pendingMonths.length > 0 ? pendingMonths.length * quotas : quotas;
  const totalAmount = (totalQuotasToCharge * unitPrice).toFixed(2).replace('.', ',');
  
  let quotasText = '';
  if (pendingMonths.length > 1) {
    quotasText = `${quotas} cota(s) por mês x ${pendingMonths.length} meses (Total: R$ ${totalAmount})`;
  } else {
    quotasText = quotas > 1 ? `${quotas} cotas (R$ ${totalAmount})` : `1 cota (R$ ${totalAmount})`;
  }

  const uploadLink = getReceiptUploadUrl(safeName, phone || undefined);

  let message = `🍀 *Bolão entre Amigos*\n\nOlá ${firstName}, tudo bem? Passando para lembrar da sua participação no *Bolão entre Amigos*.\n`;
  
  if (pendingMonths.length > 0) {
    message += `Você possui pendência referente ao(s) mês(es): *${pendingMonths.join(', ')}*.\n`;
  }
  
  message += `Total em aberto: *${quotasText}*.\n\n*Chave PIX (Celular):* ${pixKey}\n*Valor Total:* R$ ${totalAmount}\n\nApós realizar o PIX, envie o comprovante pelo link:\n${uploadLink}`;

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


/**
 * Calcula os meses pendentes com base no último mês pago e status atual.
 */
export function calculatePendingMonths(member: any): string[] {
  const pending: string[] = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Se está pendente, o mês atual é garantidamente uma pendência
  const isCurrentMonthPending = member.paymentStatus !== 'Pago' && member.isPaidInSelectedMonth !== true;
  const lastPaid = member.lastPaidMonth || member.lastPayment?.month;
  
  if (!lastPaid) {
    if (isCurrentMonthPending) {
      pending.push(`${String(currentMonth).padStart(2, '0')}/${currentYear}`);
    }
    return pending;
  }

  try {
    const [lastM, lastY] = lastPaid.split('/').map(Number);
    let iterM = lastM;
    let iterY = lastY;

    // Avança para o próximo mês após o último pago
    iterM++;
    if (iterM > 12) {
      iterM = 1;
      iterY++;
    }

    // Loop para encontrar meses entre o último pago e o atual
    while (iterY < currentYear || (iterY === currentYear && iterM < currentMonth)) {
      pending.push(`${String(iterM).padStart(2, '0')}/${iterY}`);
      iterM++;
      if (iterM > 12) {
        iterM = 1;
        iterY++;
      }
    }

    // Adiciona o mês atual se estiver pendente
    if (isCurrentMonthPending) {
      const currentMonthStr = `${String(currentMonth).padStart(2, '0')}/${currentYear}`;
      if (!pending.includes(currentMonthStr)) {
        pending.push(currentMonthStr);
      }
    }
  } catch (e) {
    if (isCurrentMonthPending) {
      pending.push(`${String(currentMonth).padStart(2, '0')}/${currentYear}`);
    }
  }

  return pending;
}

const PT_BR_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function parseMonthYearStr(monthStr?: string | null): { month: number; year: number; value: number; formatted: string } | null {
  if (!monthStr || typeof monthStr !== 'string') return null;
  const trimmed = monthStr.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const m = Number(match[1]);
  const y = Number(match[2]);
  if (m < 1 || m > 12 || y < 2000) return null;
  return {
    month: m,
    year: y,
    value: y * 12 + m,
    formatted: `${String(m).padStart(2, '0')}/${y}`
  };
}

export function getMonthNameYearBR(monthStr?: string | null): string {
  const parsed = parseMonthYearStr(monthStr);
  if (!parsed) return monthStr || '';
  return `${PT_BR_MONTH_NAMES[parsed.month - 1]}/${parsed.year}`;
}

/**
 * Calcula até 3 meses retroativos anteriores ao mês confirmado,
 * identificando quais já constam como pagos para este participante.
 */
export function getPaymentThankYouRetroactiveData(
  member: any,
  payments: any[] = [],
  confirmedMonthStr?: string | null
): {
  confirmedMonth: string;
  availableRetroactiveMonths: string[];
  preselectedRetroactiveMonths: string[];
} {
  const now = new Date();
  const fallbackMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const parsedConfirmed = parseMonthYearStr(confirmedMonthStr) || parseMonthYearStr(fallbackMonth)!;
  const confirmedMonth = parsedConfirmed.formatted;

  const memberIds = new Set(
    [member?.id, member?.uid, member?.userDocId, member?.memberDocId]
      .filter(Boolean)
      .map(v => String(v))
  );
  const memberPhone = normalizeBrazilianPhoneDigits(member?.phone || '');

  const paidMonthsMap = new Map<string, number>();

  if (Array.isArray(payments)) {
    payments.forEach(p => {
      if (!p) return;
      const pUserId = p.userId ? String(p.userId) : '';
      const pMemberId = p.memberId ? String(p.memberId) : '';
      const pPhone = normalizeBrazilianPhoneDigits(p.phone || '');
      const isSameMember =
        (pUserId && memberIds.has(pUserId)) ||
        (pMemberId && memberIds.has(pMemberId)) ||
        (memberPhone && pPhone && memberPhone === pPhone);

      if (!isSameMember) return;

      const parsedP = parseMonthYearStr(p.month || p.referenceMonth);
      if (parsedP && parsedP.value < parsedConfirmed.value) {
        paidMonthsMap.set(parsedP.formatted, parsedP.value);
      }
    });
  }

  const parsedLastPaid = parseMonthYearStr(member?.lastPaidMonth);
  if (parsedLastPaid && parsedLastPaid.value < parsedConfirmed.value) {
    paidMonthsMap.set(parsedLastPaid.formatted, parsedLastPaid.value);
  }

  // Máximo 3 meses retroativos pagos (ordenados do mais recente para o mais antigo)
  const paidRetroSorted = Array.from(paidMonthsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label)
    .slice(0, 3);

  // Últimos 3 meses calendário imediatamente anteriores ao mês confirmado
  const calendarRetro3: string[] = [];
  let iterM = parsedConfirmed.month;
  let iterY = parsedConfirmed.year;
  for (let i = 0; i < 3; i++) {
    iterM--;
    if (iterM < 1) {
      iterM = 12;
      iterY--;
    }
    calendarRetro3.push(`${String(iterM).padStart(2, '0')}/${iterY}`);
  }

  // Combina garantindo no máximo 3 meses retroativos na lista exibida
  const availableSet = new Set<string>(paidRetroSorted);
  for (const calM of calendarRetro3) {
    if (availableSet.size >= 3) break;
    availableSet.add(calM);
  }

  const availableRetroactiveMonths = Array.from(availableSet)
    .sort((a, b) => {
      const pa = parseMonthYearStr(a)?.value || 0;
      const pb = parseMonthYearStr(b)?.value || 0;
      return pb - pa;
    })
    .slice(0, 3);

  return {
    confirmedMonth,
    availableRetroactiveMonths,
    preselectedRetroactiveMonths: paidRetroSorted.slice(0, 3)
  };
}

/**
 * Gera mensagem de agradecimento e confirmação de quitação de mais um mês vigente via WhatsApp,
 * incluindo no máximo 3 meses retroativos selecionados.
 */
export function buildPaymentThankYouMessage(params: {
  memberName?: string | null;
  confirmedMonth: string;
  quotas?: number;
  amount?: number;
  retroactiveMonths?: string[];
}): string {
  const cleanName = formatFirstAndLastName(params.memberName, 'Participante');
  const firstName = cleanName.split(' ')[0] || 'Participante';
  const quotas = Number(params.quotas) > 0 ? Number(params.quotas) : 1;
  const amount = typeof params.amount === 'number' && params.amount > 0 ? params.amount : quotas * 20.0;
  const amountFormatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monthLabel = getMonthNameYearBR(params.confirmedMonth);
  const retroLimited = Array.isArray(params.retroactiveMonths)
    ? params.retroactiveMonths.filter(Boolean).slice(0, 3)
    : [];

  let message = `🍀 *Bolão Amigos — Confirmação de Pagamento*\n\n`;
  message += `Olá, *${firstName}*! 👋\n`;
  message += `Agradecemos muito pelo seu pagamento! 🙏\n\n`;
  message += `Confirmamos a quitação de mais um mês vigente no *Bolão Amigos*:\n`;
  message += `✅ *Mês vigente quitado:* ${monthLabel} (${params.confirmedMonth})\n`;
  message += `🎟️ *Cotas:* ${quotas} ${quotas > 1 ? 'cotas' : 'cota'} • *Valor:* R$ ${amountFormatted}\n`;

  if (retroLimited.length > 0) {
    message += `📅 *Meses retroativos (${retroLimited.length} ${retroLimited.length === 1 ? 'mês' : 'meses'}):* ${retroLimited.join(', ')}\n`;
  }

  message += `\nSua participação está confirmada! Boa sorte nos sorteios! 🍀🎉`;
  return message;
}

