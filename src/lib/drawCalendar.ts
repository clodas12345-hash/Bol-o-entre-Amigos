import holidaysData from '../data/holidays.json';

export interface HolidayInfo {
  isHoliday: boolean;
  name?: string;
}

export interface DrawDayInfo {
  isDraw: boolean;
  reason?: string;
}

export interface NextDrawResult {
  date: Date;
  dateFormatted: string;
  wasShifted: boolean;
  reason?: string;
  skippedDaysCount: number;
}

export interface DrawSequenceItem {
  contestIndex: number;
  date: Date;
  dateFormatted: string;
  dayName: string;
  isHoliday: boolean;
  holidayName?: string;
}

/**
 * Normaliza um objeto Date para YYYY-MM-DD em fuso horário local
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata data no padrão brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Nome do dia da semana em Português
 */
export function getDayNameBR(date: Date): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Calcula a data da Páscoa para determinado ano (Algoritmo de Meeus/Jones/Butcher)
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Verifica se uma data é Feriado Nacional Brasileiro (estático do JSON ou dinâmico)
 */
export function isNationalHoliday(date: Date): HolidayInfo {
  const dateStr = formatDateToYYYYMMDD(date);
  
  // 1. Checa no arquivo JSON configurado
  const foundInJson = holidaysData.nationalHolidays.find(h => h.date === dateStr);
  if (foundInJson) {
    return { isHoliday: true, name: foundInJson.name };
  }

  // 2. Feriados móveis calculados dinamicamente baseados na Páscoa
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  
  // Sexta-feira Santa (-2 dias da Páscoa)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  if (formatDateToYYYYMMDD(goodFriday) === dateStr) {
    return { isHoliday: true, name: 'Sexta-feira Santa' };
  }

  // Segunda de Carnaval (-48 dias da Páscoa)
  const carnivalMon = new Date(easter);
  carnivalMon.setDate(easter.getDate() - 48);
  if (formatDateToYYYYMMDD(carnivalMon) === dateStr) {
    return { isHoliday: true, name: 'Carnaval' };
  }

  // Terça de Carnaval (-47 dias da Páscoa)
  const carnivalTue = new Date(easter);
  carnivalTue.setDate(easter.getDate() - 47);
  if (formatDateToYYYYMMDD(carnivalTue) === dateStr) {
    return { isHoliday: true, name: 'Carnaval' };
  }

  // Corpus Christi (+60 dias da Páscoa)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  if (formatDateToYYYYMMDD(corpusChristi) === dateStr) {
    return { isHoliday: true, name: 'Corpus Christi' };
  }

  // 3. Feriados fixos recorrentes
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 1 && day === 1) return { isHoliday: true, name: 'Confraternização Universal' };
  if (month === 4 && day === 21) return { isHoliday: true, name: 'Tiradentes' };
  if (month === 5 && day === 1) return { isHoliday: true, name: 'Dia do Trabalho' };
  if (month === 9 && day === 7) return { isHoliday: true, name: 'Independência do Brasil' };
  if (month === 10 && day === 12) return { isHoliday: true, name: 'Nossa Senhora Aparecida' };
  if (month === 11 && day === 2) return { isHoliday: true, name: 'Finados' };
  if (month === 11 && day === 15) return { isHoliday: true, name: 'Proclamação da República' };
  if (month === 11 && day === 20) return { isHoliday: true, name: 'Dia da Consciência Negra' };
  if (month === 12 && day === 25) return { isHoliday: true, name: 'Natal' };
  if (month === 12 && day === 31) return { isHoliday: true, name: 'Véspera de Ano Novo (Sem Sorteio Caixa)' };

  return { isHoliday: false };
}

/**
 * Checa se determinado dia é um dia válido para realização de sorteio da loteria especificada
 * Conforme nova agenda oficial da Caixa: os sorteios que ocorriam aos Sábados agora são realizados aos Domingos!
 * - Lotofácil: Segunda a Sexta e Domingo (dias 0, 1, 2, 3, 4, 5) — Sem sorteio aos Sábados (6)
 * - Mega-Sena: Terça, Quinta e Domingo (dias 0, 2, 4) — Sem sorteio aos Sábados (6)
 */
export function isDrawDay(
  date: Date, 
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil'
): DrawDayInfo {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

  // 1. Sábado não possui sorteio regular (transferido para Domingo pela Caixa)
  if (dayOfWeek === 6) {
    return { isDraw: false, reason: 'Sábado (Sorteios transferidos para Domingo conforme nova agenda Caixa)' };
  }

  // 2. Dias da semana válidos por modalidade (0 = Domingo incluído!)
  const isMegaSena = lotteryType === 'megasena';
  const allowedDays = isMegaSena ? [0, 2, 4] : [0, 1, 2, 3, 4, 5]; // Lotofácil: Seg a Sex + Dom (0..5)

  if (!allowedDays.includes(dayOfWeek)) {
    return { 
      isDraw: false, 
      reason: isMegaSena ? 'Mega-Sena ocorre às Terças, Quintas e Domingos' : 'Sorteio indisponível no dia' 
    };
  }

  // 3. Checagem de Feriado Nacional
  const holiday = isNationalHoliday(date);
  if (holiday.isHoliday) {
    return { 
      isDraw: false, 
      reason: `Feriado Nacional: ${holiday.name}` 
    };
  }

  return { isDraw: true };
}

/**
 * Retorna a próxima data válida de sorteio a partir de uma data inicial, pulando fins de semana sem sorteio e feriados
 */
export function getNextDrawDate(
  fromDate: Date,
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil'
): NextDrawResult {
  const target = new Date(fromDate);
  target.setHours(0, 0, 0, 0);

  let skippedCount = 0;
  let wasShifted = false;
  let firstReason = '';

  while (true) {
    const check = isDrawDay(target, lotteryType);
    if (check.isDraw) {
      break;
    }
    if (!wasShifted) {
      wasShifted = true;
      firstReason = check.reason || 'Dia sem sorteio';
    }
    target.setDate(target.getDate() + 1);
    skippedCount++;
  }

  return {
    date: target,
    dateFormatted: formatDateBR(target),
    wasShifted,
    reason: firstReason,
    skippedDaysCount: skippedCount
  };
}

/**
 * Gera uma sequência válida de N datas de sorteio consecutivas (ex: para Teimosinha),
 * saltando automaticamente domingos e feriados nacionais.
 */
export function getValidDrawSequence(
  startDate: Date,
  count: number = 1,
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil'
): DrawSequenceItem[] {
  const sequence: DrawSequenceItem[] = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);

  let index = 0;
  let safetyLimit = 0;

  while (index < count && safetyLimit < 365) {
    safetyLimit++;
    const drawCheck = isDrawDay(curr, lotteryType);
    const holidayCheck = isNationalHoliday(curr);

    if (drawCheck.isDraw) {
      sequence.push({
        contestIndex: index + 1,
        date: new Date(curr),
        dateFormatted: formatDateBR(curr),
        dayName: getDayNameBR(curr),
        isHoliday: holidayCheck.isHoliday,
        holidayName: holidayCheck.name
      });
      index++;
    }

    // Avança para o próximo dia para checar a próxima cota da teimosinha
    curr.setDate(curr.getDate() + 1);
  }

  return sequence;
}

/**
 * Calcula e ajusta o 'Concurso Vigente' de forma inteligente considerando horário (20h),
 * domingos e feriados nacionais.
 */
export function getAdjustedActiveContestInfo(
  latestContestNum: number | null,
  activePoolCurrentContest?: number | null,
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil'
) {
  const now = new Date();

  // Mantém a data no dia atual até o último minuto do dia (23h59m59s), mudando apenas na virada do dia (00h00)
  const baseDate = new Date(now);

  // Verifica se hoje/data base é dia de sorteio
  const todayDrawCheck = isDrawDay(baseDate, lotteryType);
  const nextValidDraw = getNextDrawDate(baseDate, lotteryType);

  // Concurso de referência
  const baseContestNum = Math.max(latestContestNum || 0, activePoolCurrentContest || 0);

  let displayContest = baseContestNum > 0 ? baseContestNum : null;
  if (!todayDrawCheck.isDraw && displayContest) {
    // Se hoje não há sorteio devido a domingo ou feriado, ajustamos para o próximo concurso válido
  }

  return {
    isTodayDrawDay: todayDrawCheck.isDraw,
    todayReason: todayDrawCheck.reason,
    nextDrawDate: nextValidDraw.date,
    nextDrawFormatted: nextValidDraw.dateFormatted,
    nextDrawDayName: getDayNameBR(nextValidDraw.date),
    wasAdjusted: nextValidDraw.wasShifted,
    adjustmentReason: nextValidDraw.reason,
    displayContestNum: displayContest
  };
}
