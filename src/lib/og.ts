// Картинка-превью 1200x630 для ссылок (Telegram, VK, Discord): баннер + название + инфа с VNDB.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Release } from './releases';
import { year, site } from './releases';

const font = (pkg: string, file: string) => fs.readFileSync(path.join(__ROOT__, 'node_modules/@fontsource', pkg, 'files', file));
const fonts = [
  // fontsource режет шрифты на подмножества, поэтому латиница и кириллица идут отдельными семействами с фолбэком
  { name: 'UnbLat', weight: 700 as const, data: font('unbounded', 'unbounded-latin-700-normal.woff') },
  { name: 'UnbCyr', weight: 700 as const, data: font('unbounded', 'unbounded-cyrillic-700-normal.woff') },
  { name: 'ManLat', weight: 500 as const, data: font('manrope', 'manrope-latin-500-normal.woff') },
  { name: 'ManLat', weight: 700 as const, data: font('manrope', 'manrope-latin-700-normal.woff') },
  { name: 'ManCyr', weight: 500 as const, data: font('manrope', 'manrope-cyrillic-500-normal.woff') },
  { name: 'ManCyr', weight: 700 as const, data: font('manrope', 'manrope-cyrillic-700-normal.woff') },
];
const HEAD = 'UnbLat, UnbCyr';
const BODY = 'ManLat, ManCyr';

// Мини-хелпер вместо JSX: h('div', {стили}, ...дети)
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | false | undefined)[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.filter((c) => c !== false && c !== undefined) },
});
const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } });

const dataUri = async (file: string, width: number, blur = 0) => {
  let s = sharp(file).resize(width);
  if (blur) s = s.blur(blur).modulate({ brightness: 0.45, saturation: 1.3 });
  return `data:image/jpeg;base64,${(await s.jpeg({ quality: 82 }).toBuffer()).toString('base64')}`;
};

// hsl(...) из акцента -> hex для resvg
const hex = (accent: string) => {
  const m = accent.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%/);
  if (!m) return accent;
  const [hh, ss, ll] = [+m[1], +m[2] / 100, +m[3] / 100];
  const f = (n: number) => {
    const k = (n + hh / 30) % 12;
    const c = ll - ss * Math.min(ll, 1 - ll) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export async function renderOg(r: Release): Promise<Buffer> {
  const bannerFile = r.imageFile!;
  const accent = hex(r.accent);
  const [bg, art] = await Promise.all([dataUri(bannerFile, 600, 30), dataUri(bannerFile, 1040)]);
  const avatar = `data:image/jpeg;base64,${fs.readFileSync(path.join(__ROOT__, 'public/avatar.jpg')).toString('base64')}`;
  const info = r.info;

  const rows = [
    ['Год выхода', year(r)],
    ['Разработчик', info?.developers?.join(', ')],
    ['Длительность', r.length],
    ['Платформы', r.platforms.map((p) => (p === 'pc' ? 'ПК' : 'Android')).join(', ')],
  ].filter(([, v]) => v) as [string, string][];

  const titleSize = r.title.length > 18 ? 36 : r.title.length > 12 ? 42 : 50;
  const star = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${accent}" d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`).toString('base64')}`;

  // В Telegram картинка показывается ~в 3 раза меньше, поэтому весь текст крупный (от 24px)
  const tree = h(
    'div',
    { width: 1200, height: 630, position: 'relative', background: '#08080c', fontFamily: BODY, color: '#f4f3f8' },
    img(bg, { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }),
    h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, background: 'linear-gradient(90deg, rgba(8,8,12,0.45), rgba(8,8,12,0.9))' }),
    h(
      'div',
      { position: 'absolute', top: 36, left: 40, width: 1120, height: 558, flexDirection: 'column' },
      h(
        'div',
        { height: 352, alignItems: 'center', gap: 36 },
        // Баннер
        h(
          'div',
          { width: 560, height: 315, borderRadius: 20, overflow: 'hidden', border: `3px solid ${accent}`, boxShadow: `0 0 60px ${accent}88`, flexShrink: 0 },
          img(art, { width: 560, height: 315, objectFit: 'cover' }),
        ),
        // Инфа
        h(
          'div',
          { flexDirection: 'column', width: 524 },
          h('div', { fontFamily: HEAD, fontSize: titleSize, lineHeight: 1.08, fontWeight: 700 }, r.title),
          r.subtitle && h('div', { fontSize: 30, fontWeight: 700, color: accent, marginTop: 6 }, r.subtitle),
          h(
            'div',
            { flexDirection: 'column', marginTop: 18, gap: 4 },
            ...rows.map(([k, v]) =>
              h('div', { fontSize: 27, lineHeight: 1.3 }, h('div', { color: '#b4b2c4', width: 205, flexShrink: 0, fontWeight: 500 }, k), h('div', { fontWeight: 700, flex: 1 }, v)),
            ),
          ),
          info?.rating &&
            h(
              'div',
              { alignItems: 'center', gap: 12, marginTop: 14 },
              h('div', { fontFamily: HEAD, fontSize: 50, fontWeight: 700 }, (info.rating / 10).toFixed(1)),
              img(star, { width: 42, height: 42 }),
              h('div', { fontSize: 26, color: '#b4b2c4', fontWeight: 700 }, 'VNDB'),
            ),
        ),
      ),
      // Низ: теги в два ряда и подпись группы
      h(
        'div',
        { height: 206, width: 1120, justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(255,255,255,0.12)', paddingTop: 8 },
        h(
          'div',
          { gap: 10, flexWrap: 'wrap', width: 610, height: 108, overflow: 'hidden', alignContent: 'flex-start' },
          ...r.tags.slice(0, 8).map((t) =>
            h('div', { fontSize: 25, fontWeight: 700, padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.18)' }, t),
          ),
        ),
        h(
          'div',
          { alignItems: 'center', gap: 16 },
          img(avatar, { width: 84, height: 84, borderRadius: 42, border: `3px solid ${accent}` }),
          h(
            'div',
            { flexDirection: 'column', gap: 2 },
            h('div', { fontFamily: HEAD, fontSize: 25, fontWeight: 700 }, site.name),
            h('div', { fontSize: 24, color: '#c9c7d6', fontWeight: 700 }, site.socials.telegram.replace(/^https?:\/\//, '')),
          ),
        ),
      ),
    ),
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
