export const fmtMoney = (n: number, short = false) => {
  const v = Math.round(n);
  if (short) {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' млн ₽';
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + ' тыс ₽';
  }
  return v.toLocaleString('ru-RU') + ' ₽';
};

export const fmtInt = (n: number) => Math.round(n).toLocaleString('ru-RU');

export const fmtPct = (n: number, digits = 1) => {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
};

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export const fmtDateLong = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};
