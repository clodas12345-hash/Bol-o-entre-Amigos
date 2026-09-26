// Lista de termos de baixo calão e ofensas em português
const BAD_WORDS_LIST = [
  'porra', 'caralho', 'merda', 'puta', 'puto', 'foder', 'foda', 'fodeu', 'fodase', 'foda-se',
  'buceta', 'pica', 'desgraça', 'desgraca', 'corno', 'corna', 'viado', 'veado',
  'filho da puta', 'filha da puta', 'fdp', 'pqp', 'vtnc', 'vtff', 'otario', 'otaria',
  'babaca', 'arrombado', 'arrombada', 'cacete', 'vagabundo', 'vagabunda',
  'piranha', 'cu', 'cuzão', 'cuzao', 'cuzinho', 'bastardo', 'maldito', 'maldita',
  'filhodaputa', 'filhadaputa', 'paspalho', 'chupador', 'boquete', 'viadagem'
];

/**
 * Verifica se um texto contém palavras de baixo calão.
 */
export const containsBadWords = (text: string): { hasBadWords: boolean; foundWords: string[] } => {
  if (!text) return { hasBadWords: false, foundWords: [] };

  // Normalização: minúsculo, sem acentos, substituição de leetspeak básico
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/!/g, 'i');

  const foundWords: string[] = [];

  for (const word of BAD_WORDS_LIST) {
    // Busca por palavra inteira ou padrão contido se a palavra for maior que 3 letras
    const cleanWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`\\b${cleanWord}\\b`, 'i');
    
    if (regex.test(normalized) || (cleanWord.length > 3 && normalized.includes(cleanWord))) {
      if (!foundWords.includes(word)) {
        foundWords.push(word);
      }
    }
  }

  return {
    hasBadWords: foundWords.length > 0,
    foundWords
  };
};
