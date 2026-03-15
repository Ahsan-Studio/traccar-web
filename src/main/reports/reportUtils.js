/* ─────────── Date helpers ─────────── */
export const pad = (n) => String(n).padStart(2, '0');

export const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const fmtShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const applyTimeFilter = (filterId) => {
  const now = new Date();
  let from;
  let to;
  switch (filterId) {
    case 'lastHour': from = new Date(now - 3600000); to = now; break;
    case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      from = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
      break;
    }
    case 'before2days': {
      const d2 = new Date(now); d2.setDate(d2.getDate() - 2);
      from = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
      to = now;
      break;
    }
    case 'before3days': {
      const d3 = new Date(now); d3.setDate(d3.getDate() - 3);
      from = new Date(d3.getFullYear(), d3.getMonth(), d3.getDate());
      to = now;
      break;
    }
    case 'thisWeek': {
      const day = now.getDay() || 7;
      from = new Date(now);
      from.setDate(now.getDate() - day + 1);
      from.setHours(0, 0, 0, 0);
      to = now;
      break;
    }
    case 'lastWeek': {
      const day2 = now.getDay() || 7;
      const end = new Date(now);
      end.setDate(now.getDate() - day2);
      end.setHours(23, 59, 59);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      from = start;
      to = end;
      break;
    }
    case 'thisMonth': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
    case 'lastMonth': from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
    default: from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now;
  }
  return { from: fmtLocal(from), to: fmtLocal(to) };
};

/* ─────────── Filename helper ─────────── */
export const buildFilenameBase = (name, dateFrom, dateTo) => {
  const safeName = (name || 'report').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const from = (dateFrom || '').replace(/[^0-9]/g, '_');
  const to = (dateTo || '').replace(/[^0-9]/g, '_');
  return `${safeName}_${from}_${to}`;
};
