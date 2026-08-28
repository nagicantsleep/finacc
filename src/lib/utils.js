export const TAX_CLASS = [
  { id: 0, name: '非課税', label: '非課税' },
  { id: 1, name: '税込', label: '税込' },
  { id: 2, name: '税抜', label: '税抜' },
  { id: 9, name: '対象外', label: '対象外' }
];

export const BANK_ACCOUNT_TYPE = [
  ['0', '普通預金'],
  ['1', '当座預金'],
  ['2', '貯蓄預金']
];

export const formatMoney = (val) => {
  if (val == null) return '';
  return Number(val).toLocaleString('ja-JP');
};

export const formatDate = (d) => {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const taxClass = (id) => {
  const item = TAX_CLASS.find((t) => t.id === parseInt(id, 10));
  return item ? item.name : '';
};

export const wareki = (date) => {
  if (!date) return '';
  try {
    const dateTimeFormat = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', { year: 'numeric' });
    return dateTimeFormat.format(new Date(date));
  } catch (e) {
    return '';
  }
};

export const formatFiscalHeader = (fy, lang) => {
  if (!fy || !fy.startDate || !fy.endDate) return '';
  const term = fy.term;
  const s = new Date(fy.startDate);
  const e = new Date(fy.endDate);
  const pad2 = (n) => String(n).padStart(2, '0');

  switch (lang) {
    case 'ja': {
      const wS = wareki(s);
      const wE = wareki(e);
      return `第${term}期 ${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日（${wS}）〜 ${e.getFullYear()}年${e.getMonth() + 1}月${e.getDate()}日（${wE}）`;
    }
    case 'vi':
      return `Kỳ ${term}: ${pad2(s.getDate())}/${pad2(s.getMonth() + 1)}/${s.getFullYear()} – ${pad2(e.getDate())}/${pad2(e.getMonth() + 1)}/${e.getFullYear()}`;
    case 'en':
    default: {
      const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short' });
      return `Term ${term}: ${monthFmt.format(s)} ${s.getDate()}, ${s.getFullYear()} – ${monthFmt.format(e)} ${e.getDate()}, ${e.getFullYear()}`;
    }
  }
};

export const round = (n) => {
  return Math.round(n);
};

export const numeric = (s) => {
  if (s == null) return 0;
  if (typeof s === 'number') return s;
  const cleaned = String(s).replace(/,/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

export const DateString = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const StringDate = (s) => {
  if (!s) return null;
  return new Date(s);
};

export const dateStr = (year, month, day) => {
  const fix2 = (num) => {
    const str = '0' + num.toString();
    return str.substring(str.length - 2);
  };
  day = day || 1;
  return `${year}-${fix2(month)}-${fix2(day)}`;
};

export const getCompanyInfo = async () => {
  try {
    const response = await axios.get('/api/company/?kind=1');
    const companies = response.data.companies || [];
    return companies.length > 0 ? companies[0] : null;
  } catch (e) {
    return null;
  }
};

export const isSameOrigin = (targetUrl) => {
  if (typeof window === 'undefined') return true;
  try {
    const currentOrigin = window.location.origin;
    const url = new URL(targetUrl, window.location.href);
    return url.origin === currentOrigin;
  } catch (e) {
    return false;
  }
};

export const fetchTitleFromUrl = async (url) => {
  if (typeof window === 'undefined') return null;
  try {
    const response = await axios.get(url, {
      responseType: 'text'
    });
    const htmlString = response.data;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const title = doc.querySelector('title')?.innerText || '(no title)';
    return title;
  } catch (error) {
    console.error('fetchTitleFromUrl error:', error);
    return null;
  }
};

