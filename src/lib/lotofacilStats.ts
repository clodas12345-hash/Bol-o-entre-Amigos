/**
 * Estatísticas e dezenas de ouro / quentes da Lotofácil
 */

export interface LotofacilStat {
  number: number;
  frequency: number; // Porcentagem ou contagem
}

export const LOTOFACIL_STATS: LotofacilStat[] = [
  { number: 1, frequency: 65 },
  { number: 2, frequency: 58 },
  { number: 3, frequency: 62 },
  { number: 4, frequency: 71 },
  { number: 5, frequency: 60 },
  { number: 6, frequency: 68 },
  { number: 7, frequency: 55 },
  { number: 8, frequency: 63 },
  { number: 9, frequency: 59 },
  { number: 10, frequency: 72 },
  { number: 11, frequency: 66 },
  { number: 12, frequency: 61 },
  { number: 13, frequency: 75 },
  { number: 14, frequency: 64 },
  { number: 15, frequency: 69 },
  { number: 16, frequency: 57 },
  { number: 17, frequency: 63 },
  { number: 18, frequency: 68 },
  { number: 19, frequency: 60 },
  { number: 20, frequency: 65 },
  { number: 21, frequency: 62 },
  { number: 22, frequency: 67 },
  { number: 23, frequency: 59 },
  { number: 24, frequency: 64 },
  { number: 25, frequency: 70 },
];

export function getGoldenBalancedNumbers(): number[] {
  // 15 dezenas equilibradas (Padrão Ouro)
  return [1, 2, 4, 6, 10, 11, 13, 14, 15, 17, 18, 20, 22, 24, 25];
}

export function getTopHotNumbers(count = 15): number[] {
  const sorted = [...LOTOFACIL_STATS].sort((a, b) => b.frequency - a.frequency);
  return sorted.slice(0, count).map(s => s.number);
}
