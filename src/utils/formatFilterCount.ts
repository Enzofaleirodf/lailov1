/**
 * Formatar contagem de leilões para o botão de aplicar filtros
 * 
 * Regras:
 * - Se < 1.000 → "Mostrar 243 leilões"
 * - Se >= 1.000 → "Mostrar 1.000+ leilões" (com separador de milhar e +)
 */
export const formatFilterCount = (count: number, loading: boolean = false): string => {
  if (loading) {
    return 'Carregando...';
  }

  if (count === 0) {
    return 'Nenhum leilão encontrado';
  }

  if (count < 1000) {
    return `Mostrar ${count.toLocaleString('pt-BR')} ${count === 1 ? 'leilão' : 'leilões'}`;
  }

  // Para valores >= 1.000, arredondar para milhares e adicionar "+"
  const roundedThousands = Math.floor(count / 1000) * 1000;
  return `Mostrar ${roundedThousands.toLocaleString('pt-BR')}+ leilões`;
};

/**
 * Exemplos de uso:
 * formatFilterCount(243) → "Mostrar 243 leilões"
 * formatFilterCount(1) → "Mostrar 1 leilão"
 * formatFilterCount(1823) → "Mostrar 1.000+ leilões"
 * formatFilterCount(14567) → "Mostrar 14.000+ leilões"
 * formatFilterCount(99876) → "Mostrar 99.000+ leilões"
 * formatFilterCount(100234) → "Mostrar 100.000+ leilões"
 */
