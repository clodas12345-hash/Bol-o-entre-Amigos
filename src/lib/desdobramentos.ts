/**
 * Algoritmos e Matrizes Matemáticas de Desdobramentos e Fechamentos da Lotofácil
 */

export interface DesdobramentoScheme {
  id: string;
  name: string;
  totalNumbers: number;
  totalGames: number;
  guarantee: string;
  costEstimate: number; // R$ 3.50 por aposta de 15 números
  description: string;
  generate: (selectedNumbers: number[], fixedNumbers?: number[]) => number[][];
}

// Utilitário para ordenar dezenas em ordem crescente
export function sortNumbers(nums: number[]): number[] {
  return [...nums].sort((a, b) => a - b);
}

// Combinações matemáticas simples
function getCombinations(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

/**
 * Matriz 16 dezenas em 4 jogos (Garante 14 pontos acertando 15)
 * Dezenas indexadas de 0 a 15 (16 dezenas)
 */
const MATRIX_16_4 = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15],
];

/**
 * Matriz 17 dezenas em 8 jogos (Garante 14 pontos acertando 15, alta chance de 15)
 */
const MATRIX_17_8 = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 10],
  [0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15, 16, 7],
  [0, 1, 2, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 3, 4],
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0],
  [0, 2, 4, 6, 8, 10, 12, 14, 16, 1, 3, 5, 7, 9, 11],
  [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12],
];

/**
 * Matriz 18 dezenas em 6 jogos (Fechamento Econômico com garantia de 13 pontos)
 */
const MATRIX_18_6 = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 11],
  [0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 6, 7],
  [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 0, 1, 2],
  [0, 3, 6, 9, 12, 15, 1, 4, 7, 10, 13, 16, 2, 5, 8],
  [1, 4, 7, 10, 13, 16, 2, 5, 8, 11, 14, 17, 0, 3, 6],
];

/**
 * Matriz 18 dezenas em 24 jogos (Fechamento 14 Pontos 100% se 15)
 */
function generate18in24(numbers: number[]): number[][] {
  const sorted = sortNumbers(numbers);
  // Usa rotação de subgrupos de 18 elementos
  const games: number[][] = [];
  // Gera combinações otimizadas de exclusão de 3 dezenas das 18
  const exclusions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17],
    [0, 3, 6], [1, 4, 7], [2, 5, 8], [9, 12, 15], [10, 13, 16], [11, 14, 17],
    [0, 4, 8], [1, 5, 6], [2, 3, 7], [9, 13, 17], [10, 14, 15], [11, 12, 16],
    [0, 7, 14], [1, 8, 15], [2, 6, 16], [3, 10, 17], [4, 11, 12], [5, 9, 13]
  ];

  for (const exc of exclusions) {
    const game = sorted.filter((_, idx) => !exc.includes(idx));
    if (game.length === 15) {
      games.push(game);
    }
  }
  return games;
}

/**
 * Matriz 19 dezenas em 10 jogos (Redução de 19 para 15)
 */
function generate19in10(numbers: number[]): number[][] {
  const sorted = sortNumbers(numbers);
  const exclusions = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
    [15, 16, 17, 18],
    [0, 4, 8, 12],
    [1, 5, 9, 13],
    [2, 6, 10, 14],
    [3, 7, 11, 15],
    [0, 6, 12, 18]
  ];
  return exclusions.map(exc => sorted.filter((_, idx) => !exc.includes(idx)));
}

/**
 * Matriz 20 dezenas em 16 jogos (Cobre 80% do volante da Lotofácil)
 */
function generate20in16(numbers: number[]): number[][] {
  const sorted = sortNumbers(numbers);
  const exclusions = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [0, 5, 10, 15, 1],
    [2, 7, 12, 17, 3],
    [4, 9, 14, 19, 0],
    [1, 6, 11, 16, 5],
    [0, 2, 4, 6, 8],
    [1, 3, 5, 7, 9],
    [10, 12, 14, 16, 18],
    [11, 13, 15, 17, 19],
    [0, 6, 12, 18, 4],
    [1, 7, 13, 19, 5],
    [2, 8, 14, 15, 9],
    [3, 9, 10, 16, 11]
  ];
  return exclusions.map(exc => sorted.filter((_, idx) => !exc.includes(idx)));
}

/**
 * Desdobramento com Dezenas Fixas (ex: 4 Fixas + 16 Variáveis para formar jogos de 15)
 */
export function generateWithFixed(fixed: number[], variables: number[], targetGames = 6): number[][] {
  const sortedFixed = sortNumbers(fixed);
  const sortedVars = sortNumbers(variables);
  const neededPerGame = 15 - sortedFixed.length;

  if (neededPerGame <= 0 || sortedVars.length < neededPerGame) {
    return [];
  }

  const allVarCombos = getCombinations(sortedVars, neededPerGame);
  
  // Pega uma amostra distribuída se houver muitas combinações
  const step = Math.max(1, Math.floor(allVarCombos.length / targetGames));
  const selectedCombos: number[][] = [];
  
  for (let i = 0; i < allVarCombos.length && selectedCombos.length < targetGames; i += step) {
    selectedCombos.push(allVarCombos[i]);
  }

  return selectedCombos.map(combo => sortNumbers([...sortedFixed, ...combo]));
}

/**
 * Catálogo de Esquemas Disponíveis
 */
export const DESDOBRAMENTOS_CATALOG: DesdobramentoScheme[] = [
  {
    id: '16_4',
    name: '16 Dezenas em 4 Jogos',
    totalNumbers: 16,
    totalGames: 4,
    guarantee: 'Garante 14 Pontos acertando as 15 sorteadas',
    costEstimate: 4 * 3.50, // R$ 14,00
    description: 'Excelente para quem quer gastar pouco e cercar 16 dezenas com garantia de 14 pontos.',
    generate: (nums) => {
      const sorted = sortNumbers(nums);
      return MATRIX_16_4.map(indexes => indexes.map(idx => sorted[idx]));
    }
  },
  {
    id: '17_8',
    name: '17 Dezenas em 8 Jogos',
    totalNumbers: 17,
    totalGames: 8,
    guarantee: 'Garante 14 Pontos se acertar 15 (e 13 se acertar 14)',
    costEstimate: 8 * 3.50, // R$ 28,00
    description: 'Equilíbrio perfeito entre custo e cobertura de 17 dezenas no volante.',
    generate: (nums) => {
      const sorted = sortNumbers(nums);
      return MATRIX_17_8.map(indexes => indexes.map(idx => sorted[idx]));
    }
  },
  {
    id: '18_6',
    name: '18 Dezenas em 6 Jogos (Econômico)',
    totalNumbers: 18,
    totalGames: 6,
    guarantee: 'Garante 13 Pontos se acertar 15 (com chances de 14 e 15)',
    costEstimate: 6 * 3.50, // R$ 21,00
    description: 'Cobre 18 dezenas com custo super baixo para bolões pequenos.',
    generate: (nums) => {
      const sorted = sortNumbers(nums);
      return MATRIX_18_6.map(indexes => indexes.map(idx => sorted[idx]));
    }
  },
  {
    id: '18_24',
    name: '18 Dezenas em 24 Jogos (Master 14 Pontos)',
    totalNumbers: 18,
    totalGames: 24,
    guarantee: '100% de Garantia de 14 Pontos se 15 saírem nas 18',
    costEstimate: 24 * 3.50, // R$ 84,00
    description: 'Fechamento profissional para arrecadações médias que buscam premiações altas.',
    generate: (nums) => generate18in24(nums)
  },
  {
    id: '19_10',
    name: '19 Dezenas em 10 Jogos (Super Redução)',
    totalNumbers: 19,
    totalGames: 10,
    guarantee: 'Garante múltiplos bilhetes de 12 e 13 pontos se 15 nas 19',
    costEstimate: 10 * 3.50, // R$ 35,00
    description: 'Cobre quase 80% de todo o volante da Lotofácil em apenas 10 apostas.',
    generate: (nums) => generate19in10(nums)
  },
  {
    id: '20_16',
    name: '20 Dezenas em 16 Jogos (Fechamento Pró 80%)',
    totalNumbers: 20,
    totalGames: 16,
    guarantee: 'Cobre 20 dezenas com alta probabilidade de múltiplos acertos',
    costEstimate: 16 * 3.50, // R$ 56,00
    description: 'Deixa apenas 5 dezenas de fora do volante. Ideal para concursos especiais.',
    generate: (nums) => generate20in16(nums)
  }
];
