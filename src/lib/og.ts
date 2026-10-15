// Картинки-превью 1200x630 для ссылок (Telegram, VK, Discord): постер + название + инфа с VNDB.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Release } from './releases';
import { year, site } from './releases';
import { tagColor } from './tagcolor';

const font = (pkg: string, file: string) => fs.readFileSync(path.join(__ROOT__, 'node_modules/@fontsource', pkg, 'files', file));
// fontsource режет шрифты на подмножества, поэтому латиница и кириллица идут отдельными семействами с фолбэком
const fonts = ([600, 700, 800] as const).flatMap((weight) => [
  { name: 'ManLat', weight, data: font('manrope', `manrope-latin-${weight}-normal.woff`) },
  { name: 'ManCyr', weight, data: font('manrope', `manrope-cyrillic-${weight}-normal.woff`) },
]);
const BODY = 'ManLat, ManCyr';
const DIM = 'rgba(235,232,245,0.78)';

// Мини-хелпер вместо JSX: h('div', {стили}, ...дети)
type Node = { type: string; props: Record<string, unknown> };
type Child = Node | string | false | undefined | null;
const h = (type: string, style: Record<string, unknown>, ...children: Child[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.filter((c) => c !== false && c !== undefined && c !== null) },
});
const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } });
const uri = async (s: sharp.Sharp) => `data:image/jpeg;base64,${(await s.jpeg({ quality: 85 }).toBuffer()).toString('base64')}`;
// Размытый затемнённый фон из картинки
const backdrop = (file: string, blur: number, brightness: number) =>
  uri(sharp(file).resize(600, 315, { fit: 'cover' }).blur(blur).modulate({ brightness, saturation: 1.25 }));

const avatar = () => `data:image/jpeg;base64,${fs.readFileSync(path.join(__ROOT__, 'public/avatar.jpg')).toString('base64')}`;
const star = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#b9a2ff" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
).toString('base64')}`;

const pill = (t: string) => {
  const c = tagColor(t);
  return h('div', { fontSize: 25, fontWeight: 700, padding: '5px 18px 7px', borderRadius: 999, backgroundImage: c.bg, border: `1.5px solid ${c.border}`, color: c.fg }, t);
};
// Плашка без цвета тега (счётчик переводов, платформы на главной)
const plainPill = (t: string) =>
  h('div', { fontSize: 25, fontWeight: 700, padding: '5px 18px 7px', borderRadius: 999, background: 'rgba(10,10,18,0.62)', border: '1.5px solid rgba(255,255,255,0.16)', color: '#f1eff8' }, t);
// Постер в белой рамке
const framed = (src: string, w: number, hgt: number, pad: number, radius: number, rot: number, extra: Record<string, unknown> = {}) =>
  h(
    'div',
    { width: w + pad * 2, height: hgt + pad * 2, padding: pad, background: '#fff', borderRadius: radius, boxShadow: '0 18px 50px rgba(0,0,0,0.55)', transform: `rotate(${rot}deg)`, ...extra },
    img(src, { width: w, height: hgt, borderRadius: radius - pad + 1, objectFit: 'cover' }),
  );
const layer = (style: Record<string, unknown>) => h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, ...style });

async function render(tree: Node): Promise<Buffer> {
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return sharp(png).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}

// Превью релиза. Без постера (только баннер) карточки слева нет, текст на всю ширину.
export async function renderOg(r: Release): Promise<Buffer> {
  const poster = r.posterFile;
  const info = r.info;
  const PH = 550;
  const meta = poster ? await sharp(poster).metadata() : undefined;
  const PW = meta ? Math.round((PH * meta.width!) / meta.height!) : 0;
  const [bg, art] = await Promise.all([
    poster ? backdrop(poster, 18, 0.55) : backdrop(r.imageFile!, 4, 0.4),
    poster ? uri(sharp(poster).resize({ height: PH * 2 })) : undefined,
  ]);
  const X = poster ? 32 + PW + 16 + 50 : 64;
  const W = 1200 - X - 44;

  const longest = Math.max(r.title.length + (r.subtitle ? 1 : 0), r.subtitle?.length ?? 0);
  const titleSize = longest > 22 ? 46 : longest > 18 ? 52 : longest > 14 ? 58 : longest > 10 ? 62 : 70;
  const rows = [
    ['Год выхода', year(r)],
    ['Разработчик', info?.developers?.join(', ')],
    ['Длительность', r.length],
    ['Платформы', r.platforms.map((p) => (p === 'pc' ? 'ПК' : 'Android')).join(', ')],
  ].filter(([, v]) => v) as [string, string][];

  // В Telegram картинка показывается ~в 3 раза меньше, поэтому весь текст крупный (от 25px)
  const tree = h(
    'div',
    { width: 1200, height: 630, position: 'relative', background: '#0b0b12', fontFamily: BODY, color: '#fff' },
    img(bg, { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }),
    layer({ background: 'linear-gradient(90deg, rgba(11,11,18,0.1) 0%, rgba(11,11,18,0.55) 40%, rgba(11,11,18,0.78) 100%)' }),
    art && framed(art, PW, PH, 8, 22, -2, { position: 'absolute', top: 32, left: 32 }),
    h(
      'div',
      { position: 'absolute', top: 38, left: X, width: W, height: 554, flexDirection: 'column', justifyContent: 'space-between' },
      // Название
      h(
        'div',
        { flexDirection: 'column' },
        h(
          'div',
          { flexDirection: 'column', width: W, fontSize: titleSize, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1 },
          h('div', {}, r.subtitle ? `${r.title}:` : r.title),
          r.subtitle && h('div', {}, r.subtitle),
        ),
        h('div', { fontSize: 27, fontWeight: 600, color: 'rgba(235,232,245,0.72)', marginTop: 8 }, r.original),
      ),
      // Инфа + рейтинг
      h(
        'div',
        { alignItems: 'center', justifyContent: 'space-between', width: W },
        h(
          'div',
          { flexDirection: 'column', gap: 3 },
          ...rows.map(([k, v]) => h('div', { fontSize: 27, lineHeight: 1.3 }, h('div', { fontWeight: 800, marginRight: 10 }, `${k}:`), h('div', { fontWeight: 600, color: DIM }, v))),
        ),
        info?.rating &&
          h(
            'div',
            { flexDirection: 'column', paddingLeft: 26, borderLeft: '2px solid rgba(255,255,255,0.18)' },
            h('div', { fontSize: 20, fontWeight: 700, color: 'rgba(235,232,245,0.7)', letterSpacing: 1 }, 'РЕЙТИНГ'),
            h(
              'div',
              { alignItems: 'center', gap: 8, marginTop: -4 },
              h('div', { fontSize: 76, fontWeight: 800, letterSpacing: -2 }, (info.rating / 10).toFixed(1)),
              img(star, { width: 46, height: 46 }),
            ),
          ),
      ),
      // Теги, максимум два ряда
      h('div', { gap: 10, flexWrap: 'wrap', width: W, height: 102, overflow: 'hidden', alignContent: 'flex-start' }, ...r.tags.map(pill)),
      // Группа
      h(
        'div',
        { alignItems: 'center', gap: 16 },
        img(avatar(), { width: 66, height: 66, borderRadius: 33, border: '3px solid rgba(255,255,255,0.85)' }),
        h('div', { fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }, site.name),
      ),
    ),
  );
  return render(tree);
}

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

// Превью главной: аватар, название, слоган и веер из постеров последних релизов
export async function renderHomeOg(releases: Release[]): Promise<Buffer> {
  const released = releases.filter((r) => r.status === 'released');
  // сначала вышедшие (новые первыми), добор из планов; самый свежий в веере сверху справа
  const posters = [...released, ...releases.filter((r) => r.status !== 'released')]
    .map((r) => r.posterFile)
    .filter((f): f is string => !!f)
    .slice(0, 4)
    .reverse();
  const PH = 330, PW = Math.round(PH * 0.707);
  const arts = await Promise.all(posters.map((p) => uri(sharp(p).resize(PW * 2, PH * 2, { fit: 'cover', position: 'top' }))));
  const bg = posters.length ? await backdrop(posters[posters.length - 1], 22, 0.45) : undefined;
  const fans: Record<number, { left: number; top: number; rot: number }[]> = {
    1: [{ left: 180, top: 140, rot: 3 }],
    2: [{ left: 100, top: 150, rot: -5 }, { left: 260, top: 140, rot: 5 }],
    3: [{ left: 40, top: 165, rot: -8 }, { left: 185, top: 135, rot: 0 }, { left: 330, top: 165, rot: 8 }],
    4: [{ left: 0, top: 170, rot: -9 }, { left: 125, top: 135, rot: -3 }, { left: 250, top: 135, rot: 3 }, { left: 370, top: 170, rot: 9 }],
  };
  const pos = fans[arts.length] ?? [];
  const n = released.length;
  const platforms = new Set(released.flatMap((r) => r.platforms));

  const tree = h(
    'div',
    { width: 1200, height: 630, position: 'relative', background: '#0b0b12', fontFamily: BODY, color: '#fff' },
    bg && img(bg, { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }),
    layer({ background: 'linear-gradient(90deg, rgba(11,11,18,0.85) 0%, rgba(11,11,18,0.55) 55%, rgba(11,11,18,0.25) 100%)' }),
    h(
      'div',
      { position: 'absolute', top: 0, left: 590, width: 610, height: 630 },
      ...arts.map((a, i) => framed(a, PW, PH, 6, 18, pos[i].rot, { position: 'absolute', left: pos[i].left, top: pos[i].top })),
    ),
    h(
      'div',
      { position: 'absolute', top: 60, left: 60, width: 520, height: 510, flexDirection: 'column', justifyContent: 'space-between' },
      img(avatar(), { width: 132, height: 132, borderRadius: 66, border: '4px solid rgba(255,255,255,0.9)' }),
      h(
        'div',
        { flexDirection: 'column' },
        h('div', { fontSize: 70, fontWeight: 800, lineHeight: 1.0, letterSpacing: -2, width: 520 }, site.name),
        h('div', { fontSize: 32, fontWeight: 600, color: 'rgba(235,232,245,0.82)', marginTop: 16 }, site.tagline),
      ),
      h(
        'div',
        { gap: 10 },
        plainPill(`${n} ${plural(n, 'перевод', 'перевода', 'переводов')}`),
        plainPill(platforms.has('android') ? 'ПК и Android' : 'ПК'),
      ),
    ),
  );
  return render(tree);
}
