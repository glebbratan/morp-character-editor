(() => {
  'use strict';

  /* =====================================================
     НАСТРОЙКИ
     Слои внешности лежат в assets/<часть>/<часть>-<номер>.png
     Размер любой, но пропорции как у образца 224 × 319.
     ===================================================== */
  const PORTRAIT = { w: 224, h: 319, bg: '#e4e4e2' };

  // Порядок = порядок в листалке. optional: можно выбрать «нет».
  const PARTS = [
    { key: 'head',     label: 'Форма головы', count: 3,  optional: false },
    { key: 'hair',     label: 'Причёска',     count: 5,  optional: true  },
    { key: 'mustache', label: 'Усы',          count: 3,  optional: true  },
    { key: 'beard',    label: 'Борода',       count: 3,  optional: true  },
    { key: 'clothes',  label: 'Одежда',       count: 3, optional: false },
  ];
  // Порядок наложения: снизу вверх.
  const DRAW_ORDER = ['head', 'clothes', 'beard', 'mustache', 'hair'];
  const assetPath = (key, n) => `assets/${key}/${key}-${n}.png`;

  const NATIONALITIES = [
    'лантиец', 'исилиец', 'вадалиец', 'острабаниец', 'ветар', 'тофхалец',
    'тофвалец', 'товахиец', 'лантиец-ферлантияк', 'катландец', 'лумериец', 'другое',
  ];
  const RELIGIONS = [
    'южный римхель', 'вархоль', 'паромон', 'северный римхель', 'восточный римхель',
  ];

  // Оформление карточки
  const C = {
    paper: '#f1ead8', mat: '#f8f3e5', ink: '#2f2b24',
    muted: '#857b64', line: '#c4b99c', red: '#9b4b3d',
  };
  const SERIF = '"Old Standard TT", "PT Serif", Georgia, serif';
  const MONO = '"IBM Plex Mono", "Courier New", monospace';
  const SCALE = 2;          // качество итоговой картинки (2 = 2000 px в ширину)
  const CARD_W = 1000;
  const PAD = 60;
  const LINE_H = 28;

  /* ===================================================== */

  const $ = (id) => document.getElementById(id);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const card = $('card');
  const ctx = card.getContext('2d');
  const measure = document.createElement('canvas').getContext('2d');

  const state = {};
  PARTS.forEach((p) => { state[p.key] = 1; });

  /* ---------- картинки ---------- */
  const imgCache = new Map();
  function getImg(src) {
    let e = imgCache.get(src);
    if (!e) {
      const img = new Image();
      e = { img };
      img.onload = () => render();
      img.src = src;
      imgCache.set(src, e);
    }
    return e.img;
  }
  const ready = (img) => img.complete && img.naturalWidth > 0;

  /* ---------- листалка ---------- */
  const pickersEl = $('pickers');
  const valEls = {};

  PARTS.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'picker';
    row.innerHTML =
      `<span class="p-label">${p.label}</span>` +
      `<div class="p-ctrl">` +
      `<button type="button" class="arrow" aria-label="${p.label}: назад">‹</button>` +
      `<span class="p-val"></span>` +
      `<button type="button" class="arrow" aria-label="${p.label}: вперёд">›</button>` +
      `</div>`;
    const [prev, next] = row.querySelectorAll('.arrow');
    valEls[p.key] = row.querySelector('.p-val');
    prev.addEventListener('click', () => step(p, -1));
    next.addEventListener('click', () => step(p, +1));
    pickersEl.appendChild(row);
    // подгружаем все варианты заранее, чтобы листалка не мигала
    for (let n = 1; n <= p.count; n++) getImg(assetPath(p.key, n));
  });

  function step(p, dir) {
    const min = p.optional ? 0 : 1;
    let v = state[p.key] + dir;
    if (v > p.count) v = min;
    if (v < min) v = p.count;
    state[p.key] = v;
    updatePickers();
    render();
  }

  function updatePickers() {
    PARTS.forEach((p) => {
      const v = state[p.key];
      valEls[p.key].textContent = v === 0 ? 'нет' : `${v} / ${p.count}`;
    });
  }

  $('random').addEventListener('click', () => {
    PARTS.forEach((p) => {
      const min = p.optional ? 0 : 1;
      state[p.key] = min + Math.floor(Math.random() * (p.count - min + 1));
    });
    updatePickers();
    render();
  });

  /* ---------- форма ---------- */
  const natSel = $('nationality');
  NATIONALITIES.forEach((n) => natSel.add(new Option(cap(n), n)));
  const relSel = $('religion');
  RELIGIONS.forEach((r) => relSel.add(new Option(cap(r), r)));

  function clampAge(v) {
    let n = parseInt(v, 10);
    if (Number.isNaN(n)) n = 35;
    return Math.min(70, Math.max(25, n));
  }

  function readForm() {
    const isOther = natSel.value === 'другое';
    const custom = $('natCustom').value.trim();
    return {
      name: $('name').value.trim(),
      gender: document.querySelector('input[name="gender"]:checked').value,
      age: clampAge($('age').value),
      nationality: isOther ? (custom ? cap(custom) : 'Другое') : cap(natSel.value),
      job: $('job').value.trim(),
      religion: cap(relSel.value),
      city: $('city').value.trim(),
      origin: $('origin').value.trim(),
      bio: $('bio').value,
    };
  }

  $('form').addEventListener('input', () => {
    $('count').textContent = `${$('bio').value.length} / 700`;
    render();
  });
  $('form').addEventListener('change', () => {
    $('natCustomWrap').hidden = natSel.value !== 'другое';
    $('age').value = clampAge($('age').value);
    render();
  });
  $('form').addEventListener('submit', (e) => e.preventDefault());

  /* ---------- вспомогательное для текста ---------- */
  function years(n) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return `${n} год`;
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return `${n} года`;
    return `${n} лет`;
  }

  function setSpacing(c, px) {
    if ('letterSpacing' in c) c.letterSpacing = `${px}px`;
  }

  function wrapText(c, text, maxW) {
    const out = [];
    for (const para of text.replace(/\r/g, '').split('\n')) {
      if (!para.trim()) { out.push(''); continue; }
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        let w = word;
        const test = line ? `${line} ${w}` : w;
        if (c.measureText(test).width <= maxW) { line = test; continue; }
        if (line) { out.push(line); line = ''; }
        while (c.measureText(w).width > maxW && w.length > 1) {
          let i = w.length;
          while (i > 1 && c.measureText(w.slice(0, i)).width > maxW) i--;
          out.push(w.slice(0, i));
          w = w.slice(i);
        }
        line = w;
      }
      if (line) out.push(line);
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return out;
  }

  // Подгоняет размер шрифта под ширину; если не влезает — ставит «…»
  function fitText(c, text, maxW, size, minSize, fontFn) {
    let s = size;
    c.font = fontFn(s);
    while (s > minSize && c.measureText(text).width > maxW) {
      s -= 1;
      c.font = fontFn(s);
    }
    if (c.measureText(text).width > maxW) {
      let t = text;
      while (t.length > 1 && c.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
      return `${t}…`;
    }
    return text;
  }

  function diamond(c, x, y, r) {
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    c.fill();
  }

  // Фактура бумаги — лёгкий шум, создаётся один раз
  const paperNoise = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const x = c.getContext('2d');
    const d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = (Math.random() * 14) | 0;
    }
    x.putImageData(d, 0, 0);
    return c;
  })();

  /* ---------- отрисовка карточки ---------- */
  function render() {
    const d = readForm();

    // высота зависит от длины истории
    measure.font = `400 20px ${SERIF}`;
    setSpacing(measure, 0);
    const bioLines = d.bio.trim() ? wrapText(measure, d.bio.trim(), CARD_W - PAD * 2) : [];
    const bioBase = 644;
    const textEnd = bioBase + Math.max(bioLines.length - 1, 0) * LINE_H;
    const CH = Math.max(740, textEnd + 74);

    card.width = CARD_W * SCALE;
    card.height = CH * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // бумага
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, CARD_W, CH);
    ctx.fillStyle = ctx.createPattern(paperNoise, 'repeat');
    ctx.fillRect(0, 0, CARD_W, CH);

    // рамка
    ctx.strokeStyle = C.ink;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, CARD_W - 44, CH - 44);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.75;
    ctx.strokeRect(30, 30, CARD_W - 60, CH - 60);
    ctx.globalAlpha = 1;

    // шапка
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted;
    ctx.font = `500 12px ${MONO}`;
    setSpacing(ctx, 3);
    ctx.fillText('КАРТОЧКА ПЕРСОНАЖА', PAD, 68);

    const num = String(
      [...d.name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 10000, 0)
    ).padStart(4, '0');
    ctx.textAlign = 'right';
    ctx.fillStyle = C.red;
    setSpacing(ctx, 2);
    ctx.fillText(`№ ${num}`, CARD_W - PAD, 68);

    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `700 36px ${SERIF}`;
    setSpacing(ctx, 8);
    ctx.fillText('ЛИЧНОЕ ДЕЛО', CARD_W / 2 + 4, 104);

    ctx.strokeStyle = C.ink;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, 122); ctx.lineTo(CARD_W / 2 - 14, 122);
    ctx.moveTo(CARD_W / 2 + 14, 122); ctx.lineTo(CARD_W - PAD, 122);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.red;
    diamond(ctx, CARD_W / 2, 122, 4.5);

    // портрет
    const k = 1.2;
    const pw = PORTRAIT.w * k, ph = PORTRAIT.h * k;
    const px = PAD, py = 152;

    ctx.save();
    ctx.shadowColor = 'rgba(60, 50, 30, 0.22)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = C.mat;
    ctx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
    ctx.restore();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 10.5, py - 10.5, pw + 21, ph + 21);

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.fillStyle = PORTRAIT.bg;
    ctx.fillRect(px, py, pw, ph);
    DRAW_ORDER.forEach((key) => {
      const n = state[key];
      if (!n) return;
      const img = getImg(assetPath(key, n));
      if (ready(img)) ctx.drawImage(img, px, py, pw, ph);
    });
    ctx.restore();

    // поля анкеты
    const x0 = 400, fw = CARD_W - PAD - x0;
    const rows = [
      ['Имя', d.name, true],
      ['Пол', d.gender],
      ['Национальность', d.nationality],
      ['Должность', d.job],
      ['Религия', d.religion],
      ['Возраст', years(d.age)],
      ['Город нахождения', d.city],
      ['Город происхождения', d.origin],
    ];
    const pitch = 48;
    rows.forEach(([label, value, big], i) => {
      const y = 160 + i * pitch;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.font = `500 11px ${MONO}`;
      setSpacing(ctx, 2);
      ctx.fillText(label.toUpperCase(), x0, y);

      setSpacing(ctx, 0);
      const empty = !value;
      const shown = empty ? '—' : value;
      ctx.fillStyle = empty ? C.line : C.ink;
      const fontFn = big
        ? (s) => `700 ${s}px ${SERIF}`
        : (s) => `400 ${s}px ${SERIF}`;
      const txt = fitText(ctx, shown, fw, big ? 28 : 22, 14, fontFn);
      ctx.fillText(txt, x0, y + 28);

      ctx.save();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([1.5, 3.5]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y + 38);
      ctx.lineTo(x0 + fw, y + 38);
      ctx.stroke();
      ctx.restore();
    });

    // краткая история
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted;
    ctx.font = `500 11px ${MONO}`;
    setSpacing(ctx, 2);
    ctx.fillText('КРАТКАЯ ИСТОРИЯ', PAD, 598);

    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, 610);
    ctx.lineTo(CARD_W - PAD, 610);
    ctx.stroke();
    ctx.restore();

    setSpacing(ctx, 0);
    if (bioLines.length) {
      ctx.fillStyle = C.ink;
      ctx.font = `400 20px ${SERIF}`;
      bioLines.forEach((line, i) => ctx.fillText(line, PAD, bioBase + i * LINE_H));
    } else {
      ctx.fillStyle = C.line;
      ctx.font = `italic 400 20px ${SERIF}`;
      ctx.fillText('—', PAD, bioBase);
    }
  }

  /* ---------- сохранение ---------- */
  const note = $('note');
  $('save').addEventListener('click', () => {
    note.textContent = '';
    render();
    try {
      card.toBlob((blob) => {
        if (!blob) { note.textContent = 'Не удалось создать картинку.'; return; }
        const base = $('name').value.trim()
          .replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_') || 'персонаж';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${base}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      }, 'image/png');
    } catch (err) {
      note.textContent =
        'Браузер не даёт сохранить картинку, если страница открыта прямо из файла. ' +
        'Откройте сайт через GitHub Pages или локальный сервер (см. README).';
    }
  });

  /* ---------- старт ---------- */
  updatePickers();
  render();

  // когда подгрузятся шрифты — перерисовать, чтобы текст на карточке был в нужном стиле
  if (document.fonts && document.fonts.load) {
    const specs = [
      '700 20px "Old Standard TT"', '400 20px "Old Standard TT"',
      'italic 400 20px "Old Standard TT"',
      '500 12px "IBM Plex Mono"', '400 12px "IBM Plex Mono"',
    ];
    Promise.all(specs.map((f) => document.fonts.load(f, 'АаЯя№')))
      .catch(() => {})
      .then(render);
  }
})();
