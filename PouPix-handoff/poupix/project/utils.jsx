// Shared utilities — formatters, status logic, icons
// Exposes globals: PPx (utilities), Icon (component)

(function () {
  const MONTH_NAMES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const MONTH_NAMES_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  function monthFromKey(key) {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }
  function monthLabel(key) {
    const d = monthFromKey(key);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }
  function shiftMonth(key, delta) {
    const d = monthFromKey(key);
    d.setMonth(d.getMonth() + delta);
    return monthKey(d);
  }

  function formatBRL(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const [int, dec] = abs.toFixed(2).split('.');
    const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}R$ ${intFmt},${dec}`;
  }
  function formatBRLcompact(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 1000) {
      return `${sign}R$ ${(abs / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return formatBRL(n);
  }
  function formatDateShort(d) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  function formatDateFull(d) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  function parseAmountInput(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const cleaned = String(str).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }

  function statusOf(entry, today) {
    if (entry.paid !== null && entry.paid !== undefined) return 'paid';
    if (entry.date < startOfDay(today)) return 'overdue';
    return 'pending';
  }
  function startOfDay(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
  }
  function daysBetween(a, b) {
    const ms = startOfDay(b) - startOfDay(a);
    return Math.round(ms / 86400000);
  }

  function categoryById(id, kind) {
    const all = kind === 'income' ? PouPixData.CATEGORIES.income : PouPixData.CATEGORIES.expense;
    return all.find(c => c.id === id) || { id, label: id, color: '#888' };
  }

  window.PPx = {
    MONTH_NAMES, MONTH_NAMES_SHORT,
    monthKey, monthFromKey, monthLabel, shiftMonth,
    formatBRL, formatBRLcompact, formatDateShort, formatDateFull, parseAmountInput,
    statusOf, startOfDay, daysBetween, categoryById,
  };

  // ===== Icons =====
  function Icon({ name, size = 14, stroke = 1.75 }) {
    const props = {
      width: size, height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: stroke,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    const paths = {
      chevronLeft: <polyline points="15 18 9 12 15 6" />,
      chevronRight: <polyline points="9 18 15 12 9 6" />,
      chevronDown: <polyline points="6 9 12 15 18 9" />,
      search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
      check: <polyline points="20 6 9 17 4 12" />,
      x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
      plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
      trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>,
      filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
      table: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></>,
      pie: <><path d="M21 11.5A9 9 0 1 1 12.5 3" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
      arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
      arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
      wallet: <><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M18 13.5h.01"/></>,
      clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
      alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
      paperclip: <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
      eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
      eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
      sliders: <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
      receipt: <><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2H4z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/></>,
      repeat: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
      trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    };
    return <svg {...props}>{paths[name] || null}</svg>;
  }
  window.Icon = Icon;
})();
