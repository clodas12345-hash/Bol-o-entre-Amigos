export const LOTOFACIL_PRICES: Record<number, number> = {
  15: 3.50,
  16: 56.00,
  17: 476.00,
  18: 2856.00,
  19: 13566.00,
  20: 54264.00,
};

export const MEGASENA_PRICES: Record<number, number> = {
  6: 5.00,
  7: 35.00,
  8: 140.00,
  9: 420.00,
  10: 1050.00,
  11: 2310.00,
  12: 4620.00,
  13: 8580.00,
  14: 15015.00,
  15: 25025.00,
  16: 40040.00,
  17: 61880.00,
  18: 92820.00,
  19: 135660.00,
  20: 193800.00,
};

export const LOTOFACIL_STATS = {
  totalNumbers: 25,
  minNumbers: 15,
  maxNumbers: 20,
};

export const MEGASENA_STATS = {
  totalNumbers: 60,
  minNumbers: 6,
  maxNumbers: 20,
};

export const LOTOFACIL_MULTI_PRIZES: Record<number, Record<number, Record<number, number>>> = {
  15: {
    15: { 15: 1 },
    14: { 14: 1 },
    13: { 13: 1 },
    12: { 12: 1 },
    11: { 11: 1 },
  },
  16: {
    15: { 15: 1, 14: 15 },
    14: { 14: 2, 13: 14 },
    13: { 13: 3, 12: 13 },
    12: { 12: 4, 11: 12 },
    11: { 11: 5 },
  },
  17: {
    15: { 15: 1, 14: 30, 13: 105 },
    14: { 14: 3, 13: 42, 12: 91 },
    13: { 13: 6, 12: 52, 11: 78 },
    12: { 12: 10, 11: 60 },
    11: { 11: 15 },
  },
  18: {
    15: { 15: 1, 14: 45, 13: 315, 12: 455 },
    14: { 14: 4, 13: 84, 12: 276, 11: 276 },
    13: { 13: 10, 12: 120, 11: 280 },
    12: { 12: 20, 11: 180 },
    11: { 11: 35 },
  },
  19: {
    15: { 15: 1, 14: 60, 13: 630, 12: 1820, 11: 1365 },
    14: { 14: 5, 13: 140, 12: 735, 11: 1225 },
    13: { 13: 15, 12: 240, 11: 910 },
    12: { 12: 35, 11: 420 },
    11: { 11: 70 },
  },
  20: {
    15: { 15: 1, 14: 75, 13: 1050, 12: 4550, 11: 4550 },
    14: { 14: 6, 13: 210, 12: 1540, 11: 3710 },
    13: { 13: 21, 12: 420, 11: 2170 },
    12: { 12: 56, 11: 840 },
    11: { 11: 126 },
  }
};

export const MEGASENA_MULTI_PRIZES: Record<number, Record<number, Record<number, number>>> = {
  6: {
    6: { 6: 1 },
    5: { 5: 1 },
    4: { 4: 1 },
  },
  7: {
    6: { 6: 1, 5: 6 },
    5: { 5: 2, 4: 5 },
    4: { 4: 3 },
  },
  8: {
    6: { 6: 1, 5: 12, 4: 15 },
    5: { 5: 3, 4: 15 },
    4: { 4: 6 },
  },
  9: {
    6: { 6: 1, 5: 18, 4: 45 },
    5: { 5: 4, 4: 30 },
    4: { 4: 10 },
  },
  10: {
    6: { 6: 1, 5: 24, 4: 90 },
    5: { 5: 5, 4: 50 },
    4: { 4: 15 },
  },
  11: {
    6: { 6: 1, 5: 30, 4: 150 },
    5: { 5: 6, 4: 75 },
    4: { 4: 21 },
  },
  12: {
    6: { 6: 1, 5: 36, 4: 225 },
    5: { 5: 7, 4: 105 },
    4: { 4: 28 },
  },
  13: {
    6: { 6: 1, 5: 42, 4: 315 },
    5: { 5: 8, 4: 140 },
    4: { 4: 35 },
  },
  14: {
    6: { 6: 1, 5: 48, 4: 420 },
    5: { 5: 9, 4: 180 },
    4: { 4: 42 },
  },
  15: {
    6: { 6: 1, 5: 54, 4: 540 },
    5: { 5: 10, 4: 225 },
    4: { 4: 50 },
  }
};

export function calculateGamePrize(
  gameNumbers: number[],
  drawnNumbers: number[],
  customPrize?: number,
  contestData?: any
) {
  const sortedGame = [...gameNumbers].sort((a, b) => a - b);
  const sortedDrawn = [...(drawnNumbers || [])].sort((a, b) => a - b);

  const matchedNumbers = sortedGame.filter(n => sortedDrawn.includes(n));
  const missedGameNumbers = sortedGame.filter(n => !sortedDrawn.includes(n));
  const missingDrawnNumbers = sortedDrawn.filter(n => !sortedGame.includes(n));
  const hits = matchedNumbers.length;

  if (customPrize !== undefined && customPrize > 0) {
    return {
      hits,
      prizeAmount: customPrize,
      isWinner: true,
      badgeColor: 'bg-emerald-600 text-white font-black shadow-xs',
      hitsText: `${hits} Acertos`,
      statusText: `🎉 ${hits} Acertos (R$ ${customPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      matchedNumbers,
      missedGameNumbers,
      missingDrawnNumbers,
    };
  }

  if (!drawnNumbers || drawnNumbers.length === 0) {
    return { 
      hits: 0, 
      prizeAmount: 0, 
      isWinner: false, 
      badgeColor: 'bg-gray-100 text-gray-600 border border-gray-200',
      hitsText: 'Sem resultado',
      statusText: 'Aguardando Sorteio',
      matchedNumbers: [],
      missedGameNumbers: sortedGame,
      missingDrawnNumbers: [],
    };
  }
  
  // Lógica para Lotofácil (15 drawn)
  if (drawnNumbers.length === 15) {
    const prize14 = contestData?.prize14Amount ? Number(contestData.prize14Amount) : 1500.00;
    const prize15 = contestData?.prize15Amount ? Number(contestData.prize15Amount) : 1500000.00;

    const basePrizes: Record<number, number> = {
      11: 7.00,
      12: 14.00,
      13: 35.00,
      14: prize14,
      15: prize15
    };

    const numPlayed = gameNumbers.length;
    const multiTable = LOTOFACIL_MULTI_PRIZES[numPlayed] || LOTOFACIL_MULTI_PRIZES[15];
    const prizeDistribution = multiTable[hits] || {};

    let totalPrizeAmount = 0;
    let explanationParts: string[] = [];

    Object.entries(prizeDistribution).forEach(([tierKey, qty]) => {
      const tier = Number(tierKey);
      const value = basePrizes[tier] || 0;
      const subtotal = value * qty;
      totalPrizeAmount += subtotal;
      explanationParts.push(`${qty}x prêmio de ${tier} acertos (R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    });

    let badgeColor = 'bg-gray-100 text-gray-600 border border-gray-200';
    let statusText = `${hits} Acertos`;

    if (totalPrizeAmount > 0) {
      if (hits === 15) {
        badgeColor = 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300 font-black';
        statusText = `🏆 15 PONTOS! (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      } else if (hits === 14) {
        badgeColor = 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300 font-black';
        statusText = `⭐ 14 PONTOS! (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      } else if (hits >= 11) {
        badgeColor = 'bg-emerald-600 text-white font-black shadow-xs';
        statusText = `🎉 ${hits} Acertos (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      }
    } else {
      const remaining = 11 - hits;
      statusText = `${hits} Acertos (Faltaram ${remaining} p/ premiar)`;
    }

    return {
      hits,
      prizeAmount: totalPrizeAmount,
      isWinner: hits >= 11,
      badgeColor,
      hitsText: `${hits} Acertos`,
      statusText,
      explanation: explanationParts.join(' + '),
      matchedNumbers,
      missedGameNumbers,
      missingDrawnNumbers,
    };
  }

  // Lógica para Mega-Sena (6 drawn)
  if (drawnNumbers.length === 6) {
    const prize4 = contestData?.prize4Amount ? Number(contestData.prize4Amount) : 1000.00;
    const prize5 = contestData?.prize5Amount ? Number(contestData.prize5Amount) : 45000.00;
    const prize6 = contestData?.prize6Amount ? Number(contestData.prize6Amount) : 50000000.00;

    const basePrizes: Record<number, number> = {
      4: prize4,
      5: prize5,
      6: prize6
    };

    const numPlayed = gameNumbers.length;
    const multiTable = MEGASENA_MULTI_PRIZES[numPlayed] || MEGASENA_MULTI_PRIZES[6];
    const prizeDistribution = multiTable[hits] || {};

    let totalPrizeAmount = 0;
    let explanationParts: string[] = [];

    Object.entries(prizeDistribution).forEach(([tierKey, qty]) => {
      const tier = Number(tierKey);
      const value = basePrizes[tier] || 0;
      const subtotal = value * qty;
      totalPrizeAmount += subtotal;
      explanationParts.push(`${qty}x prêmio de ${tier} acertos (R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    });

    let badgeColor = 'bg-gray-100 text-gray-600 border border-gray-200';
    let statusText = `${hits} Acertos`;

    if (totalPrizeAmount > 0) {
      if (hits === 6) {
        badgeColor = 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300 font-black';
        statusText = `🏆 SENA (6 Acertos)! (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      } else if (hits === 5) {
        badgeColor = 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300 font-black';
        statusText = `⭐ QUINA (5 Acertos)! (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      } else if (hits === 4) {
        badgeColor = 'bg-emerald-600 text-white font-black shadow-xs';
        statusText = `🎉 QUADRA (4 Acertos)! (Total: R$ ${totalPrizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      }
    } else {
      statusText = `${hits} Acertos`;
    }

    return {
      hits,
      prizeAmount: totalPrizeAmount,
      isWinner: hits >= 4,
      badgeColor,
      hitsText: `${hits} Acertos`,
      statusText,
      explanation: explanationParts.join(' + '),
      matchedNumbers,
      missedGameNumbers,
      missingDrawnNumbers,
    };
  }

  return { 
    hits, 
    prizeAmount: 0, 
    isWinner: false, 
    badgeColor: 'bg-gray-100 text-gray-600 border border-gray-200',
    hitsText: `${hits} Acertos`,
    statusText: `${hits} Acertos`,
    matchedNumbers,
    missedGameNumbers,
    missingDrawnNumbers,
  };
}
