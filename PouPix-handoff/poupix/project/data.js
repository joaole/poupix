// PouPix - seed data
// Layout do tempo: estamos em maio/2026. Existem lançamentos de mar/abr (todos baixados),
// maio (mix: baixados, pendentes, alguns vencidos), e junho (preview de fixos).

(function () {
  const TODAY = new Date(2026, 4, 23); // 23 mai 2026

  const CATEGORIES = {
    income: [
      { id: 'salario', label: 'Salário', color: 'oklch(0.65 0.13 145)' },
      { id: 'pensao', label: 'Pensão', color: 'oklch(0.68 0.11 165)' },
      { id: 'extra', label: 'Renda extra', color: 'oklch(0.7 0.1 130)' },
    ],
    expense: [
      { id: 'moradia', label: 'Moradia', color: 'oklch(0.55 0.13 25)' },
      { id: 'utilidades', label: 'Utilidades', color: 'oklch(0.6 0.12 45)' },
      { id: 'mercado', label: 'Mercado', color: 'oklch(0.62 0.13 70)' },
      { id: 'saude', label: 'Saúde', color: 'oklch(0.58 0.12 0)' },
      { id: 'transporte', label: 'Transporte', color: 'oklch(0.6 0.1 260)' },
      { id: 'lazer', label: 'Lazer', color: 'oklch(0.6 0.11 310)' },
      { id: 'assinaturas', label: 'Assinaturas', color: 'oklch(0.6 0.1 220)' },
      { id: 'cartao', label: 'Cartão', color: 'oklch(0.5 0.12 340)' },
      { id: 'outros', label: 'Outros', color: 'oklch(0.65 0.04 250)' },
    ],
  };

  // Lançamentos fixos (template). Geram um lançamento por mês.
  const FIXED = [
    // Receitas
    { id: 'fx-salario', kind: 'income', day: 5, description: 'Salário CLT', category: 'salario', amount: 4850.00 },
    { id: 'fx-pensao', kind: 'income', day: 10, description: 'Pensão alimentícia', category: 'pensao', amount: 1200.00 },
    // Despesas
    { id: 'fx-aluguel', kind: 'expense', day: 5, description: 'Aluguel apartamento', category: 'moradia', amount: 1850.00 },
    { id: 'fx-condominio', kind: 'expense', day: 10, description: 'Condomínio', category: 'moradia', amount: 420.00 },
    { id: 'fx-luz', kind: 'expense', day: 15, description: 'Conta de luz', category: 'utilidades', amount: 198.50 },
    { id: 'fx-agua', kind: 'expense', day: 18, description: 'Conta de água', category: 'utilidades', amount: 84.00 },
    { id: 'fx-internet', kind: 'expense', day: 20, description: 'Internet fibra', category: 'utilidades', amount: 109.90 },
    { id: 'fx-saude', kind: 'expense', day: 8, description: 'Plano de saúde', category: 'saude', amount: 489.00 },
    { id: 'fx-cartao', kind: 'expense', day: 12, description: 'Fatura cartão', category: 'cartao', amount: 0, dynamic: true }, // valor varia
    { id: 'fx-netflix', kind: 'expense', day: 22, description: 'Netflix', category: 'assinaturas', amount: 55.90 },
    { id: 'fx-spotify', kind: 'expense', day: 14, description: 'Spotify', category: 'assinaturas', amount: 21.90 },
    { id: 'fx-academia', kind: 'expense', day: 5, description: 'Academia', category: 'lazer', amount: 99.90 },
  ];

  // Lançamentos variáveis (existem só no mês criado).
  // Vamos gerar para mar, abr e mai.
  const VARIABLE = [
    // === Março 2026 (todos baixados) ===
    { month: '2026-03', day: 3, kind: 'expense', description: 'Mercado Pão de Açúcar', category: 'mercado', amount: 387.45, paid: 387.45, paidDay: 3 },
    { month: '2026-03', day: 9, kind: 'expense', description: 'Farmácia Drogasil', category: 'saude', amount: 78.20, paid: 78.20, paidDay: 9 },
    { month: '2026-03', day: 12, kind: 'expense', description: 'Uber semana', category: 'transporte', amount: 142.80, paid: 142.80, paidDay: 12 },
    { month: '2026-03', day: 15, kind: 'expense', description: 'Mercado Carrefour', category: 'mercado', amount: 312.10, paid: 312.10, paidDay: 15 },
    { month: '2026-03', day: 18, kind: 'expense', description: 'Almoço c/ pais', category: 'lazer', amount: 165.00, paid: 165.00, paidDay: 18 },
    { month: '2026-03', day: 22, kind: 'expense', description: 'Cinema', category: 'lazer', amount: 64.00, paid: 64.00, paidDay: 22 },
    { month: '2026-03', day: 25, kind: 'expense', description: 'Mercado feira', category: 'mercado', amount: 89.30, paid: 89.30, paidDay: 25 },
    { month: '2026-03', day: 28, kind: 'income', description: 'Freelance logo', category: 'extra', amount: 800.00, paid: 800.00, paidDay: 28 },
    { month: '2026-03', day: 29, kind: 'expense', description: 'Posto Shell', category: 'transporte', amount: 220.00, paid: 220.00, paidDay: 29 },

    // === Abril 2026 (todos baixados) ===
    { month: '2026-04', day: 2, kind: 'expense', description: 'Mercado mensal', category: 'mercado', amount: 612.40, paid: 612.40, paidDay: 2 },
    { month: '2026-04', day: 6, kind: 'expense', description: 'Presente aniversário irmã', category: 'outros', amount: 180.00, paid: 180.00, paidDay: 6 },
    { month: '2026-04', day: 11, kind: 'expense', description: 'Restaurante japonês', category: 'lazer', amount: 198.50, paid: 198.50, paidDay: 11 },
    { month: '2026-04', day: 14, kind: 'expense', description: 'Uber + 99', category: 'transporte', amount: 167.30, paid: 167.30, paidDay: 14 },
    { month: '2026-04', day: 17, kind: 'expense', description: 'Farmácia Pacheco', category: 'saude', amount: 124.60, paid: 124.60, paidDay: 17 },
    { month: '2026-04', day: 19, kind: 'expense', description: 'Mercado Hortifruti', category: 'mercado', amount: 215.80, paid: 215.80, paidDay: 19 },
    { month: '2026-04', day: 23, kind: 'expense', description: 'Show indie rock', category: 'lazer', amount: 145.00, paid: 145.00, paidDay: 23 },
    { month: '2026-04', day: 26, kind: 'expense', description: 'Mercado semana', category: 'mercado', amount: 174.20, paid: 174.20, paidDay: 26 },
    { month: '2026-04', day: 28, kind: 'expense', description: 'Posto Ipiranga', category: 'transporte', amount: 200.00, paid: 200.00, paidDay: 28 },

    // === Maio 2026 (mix) ===
    { month: '2026-05', day: 3, kind: 'expense', description: 'Mercado mensal', category: 'mercado', amount: 580.00, paid: 624.18, paidDay: 3, note: 'Vinho extra' },
    { month: '2026-05', day: 7, kind: 'expense', description: 'Farmácia', category: 'saude', amount: 95.00, paid: 95.00, paidDay: 7 },
    { month: '2026-05', day: 11, kind: 'expense', description: 'Uber semana 1', category: 'transporte', amount: 130.00, paid: 130.00, paidDay: 11 },
    { month: '2026-05', day: 14, kind: 'expense', description: 'Mercado feira', category: 'mercado', amount: 110.00, paid: 142.60, paidDay: 14 },
    { month: '2026-05', day: 16, kind: 'expense', description: 'Jantar c/ amigos', category: 'lazer', amount: 180.00, paid: 180.00, paidDay: 16 },
    { month: '2026-05', day: 18, kind: 'expense', description: 'Posto', category: 'transporte', amount: 200.00, paid: 200.00, paidDay: 18 },
    { month: '2026-05', day: 20, kind: 'expense', description: 'Uber semana 2', category: 'transporte', amount: 95.00 }, // pendente
    { month: '2026-05', day: 22, kind: 'expense', description: 'Mercado reforço', category: 'mercado', amount: 220.00 }, // pendente, vencido hoje
    { month: '2026-05', day: 25, kind: 'expense', description: 'Presente aniversário Lucas', category: 'outros', amount: 120.00 }, // pendente futuro
    { month: '2026-05', day: 28, kind: 'expense', description: 'Show de stand-up', category: 'lazer', amount: 80.00 }, // pendente futuro
    { month: '2026-05', day: 15, kind: 'income', description: 'Freelance site cliente X', category: 'extra', amount: 1500.00 }, // pendente vencido
  ];

  // Override de valores de fixos para meses específicos (ex: cartão varia mês a mês).
  // Também marca quais fixos foram baixados em quais meses, com valor real opcional.
  const FIXED_HISTORY = {
    '2026-03': {
      'fx-salario': { paid: 4850.00 },
      'fx-pensao': { paid: 1200.00 },
      'fx-aluguel': { paid: 1850.00 },
      'fx-condominio': { paid: 420.00 },
      'fx-luz': { amount: 178.40, paid: 178.40 },
      'fx-agua': { amount: 79.20, paid: 79.20 },
      'fx-internet': { paid: 109.90 },
      'fx-saude': { paid: 489.00 },
      'fx-cartao': { amount: 920.50, paid: 920.50 },
      'fx-netflix': { paid: 55.90 },
      'fx-spotify': { paid: 21.90 },
      'fx-academia': { paid: 99.90 },
    },
    '2026-04': {
      'fx-salario': { paid: 4912.30, note: 'Hora extra' },
      'fx-pensao': { paid: 1200.00 },
      'fx-aluguel': { paid: 1850.00 },
      'fx-condominio': { paid: 420.00 },
      'fx-luz': { amount: 211.80, paid: 211.80 },
      'fx-agua': { amount: 91.40, paid: 91.40 },
      'fx-internet': { paid: 109.90 },
      'fx-saude': { paid: 489.00 },
      'fx-cartao': { amount: 1184.20, paid: 1184.20 },
      'fx-netflix': { paid: 55.90 },
      'fx-spotify': { paid: 21.90 },
      'fx-academia': { paid: 99.90 },
    },
    '2026-05': {
      // Baixados
      'fx-salario': { paid: 4850.00 },
      'fx-aluguel': { paid: 1850.00 },
      'fx-academia': { paid: 99.90 },
      'fx-saude': { paid: 489.00 },
      'fx-condominio': { paid: 420.00 },
      'fx-cartao': { amount: 1342.80 }, // pendente, valor já chegou na fatura
      // Resto pendente (sem entrada)
    },
  };

  // Constrói lançamentos virtualizados para um mês dado (YYYY-MM)
  function buildEntriesForMonth(month) {
    const [y, m] = month.split('-').map(Number);
    const entries = [];

    // 1. Fixos
    for (const fx of FIXED) {
      const hist = (FIXED_HISTORY[month] || {})[fx.id] || {};
      const amount = hist.amount !== undefined ? hist.amount : fx.amount;
      // Cartão sem histórico fica oculto se for mês futuro sem valor previsto
      if (fx.dynamic && amount === 0 && !hist.amount && !hist.paid) continue;
      entries.push({
        id: `${month}-${fx.id}`,
        templateId: fx.id,
        kind: fx.kind,
        type: 'fixo',
        date: new Date(y, m - 1, fx.day),
        description: fx.description,
        category: fx.category,
        amount,
        paid: hist.paid !== undefined ? hist.paid : null,
        paidDate: hist.paid !== undefined ? new Date(y, m - 1, hist.paidDay || fx.day) : null,
        note: hist.note || '',
        attachment: hist.attachment || null,
      });
    }
    // 2. Variáveis
    for (const v of VARIABLE) {
      if (v.month !== month) continue;
      entries.push({
        id: `${month}-v-${v.day}-${v.description.slice(0, 10)}-${v.amount}`,
        kind: v.kind,
        type: 'variável',
        date: new Date(y, m - 1, v.day),
        description: v.description,
        category: v.category,
        amount: v.amount,
        paid: v.paid !== undefined ? v.paid : null,
        paidDate: v.paid !== undefined ? new Date(y, m - 1, v.paidDay || v.day) : null,
        note: v.note || '',
        attachment: null,
      });
    }
    return entries.sort((a, b) => a.date - b.date);
  }

  // Histórico para gráfico de evolução (jan-mai/26)
  const HISTORY_SUMMARY = [
    { month: '2026-01', label: 'Jan', income: 6890, expense: 5210 },
    { month: '2026-02', label: 'Fev', income: 6050, expense: 5480 },
    { month: '2026-03', label: 'Mar', income: 6850, expense: 5343 },
    { month: '2026-04', label: 'Abr', income: 6112, expense: 5479 },
    // Mai será calculado em tempo real
  ];

  // Detalhamento mensal por categoria (para tela de Evolução Mensal)
  // Inclui receitas por fonte e gastos por categoria, separados em fixo/variável.
  // jan/fev são sintéticos; mar/abr/mai derivam dos dados acima.
  const HISTORY_DETAILED = [
    {
      month: '2026-01', label: 'Jan',
      income: { salario: 4720, pensao: 1200, extra: 970 },
      fixedByCategory: { moradia: 2270, utilidades: 380, saude: 489, cartao: 780, assinaturas: 78, lazer: 100 },
      variableByCategory: { mercado: 920, transporte: 280, saude: 65, lazer: 145, outros: 65 },
    },
    {
      month: '2026-02', label: 'Fev',
      income: { salario: 4850, pensao: 1200, extra: 0 },
      fixedByCategory: { moradia: 2270, utilidades: 415, saude: 489, cartao: 1050, assinaturas: 78, lazer: 100 },
      variableByCategory: { mercado: 740, transporte: 220, saude: 110, lazer: 0, outros: 0 },
    },
    {
      month: '2026-03', label: 'Mar',
      income: { salario: 4850, pensao: 1200, extra: 800 },
      fixedByCategory: { moradia: 2270, utilidades: 367, saude: 489, cartao: 921, assinaturas: 78, lazer: 100 },
      variableByCategory: { mercado: 789, transporte: 363, saude: 78, lazer: 229, outros: 0 },
    },
    {
      month: '2026-04', label: 'Abr',
      income: { salario: 4912, pensao: 1200, extra: 0 },
      fixedByCategory: { moradia: 2270, utilidades: 413, saude: 489, cartao: 1184, assinaturas: 78, lazer: 100 },
      variableByCategory: { mercado: 1002, transporte: 367, saude: 125, lazer: 343, outros: 180 },
    },
    // mai/26: derivado em tempo real
  ];

  window.PouPixData = {
    TODAY,
    CATEGORIES,
    FIXED,
    VARIABLE,
    FIXED_HISTORY,
    HISTORY_SUMMARY,
    HISTORY_DETAILED,
    buildEntriesForMonth,
  };
})();
