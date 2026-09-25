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
 * Gera o link wa.me com valor exato das cotas e chave PIX cadastrada.
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

  const message = `Olá ${firstName}, tudo bem? Passando para lembrar da sua participação no Bolão da Lotofácil 🍀.
Você possui *${quotasText}* em aberto.

📱 *Chave PIX (Celular):* ${pixKey}
💰 *Valor Total:* R$ ${totalAmount}

Após realizar o PIX, favor enviar o comprovante no app: ${window.location.origin}`;
  
  const fullNumber = normalizeBrazilianPhoneDigits(phone);
  if (!fullNumber) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
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
