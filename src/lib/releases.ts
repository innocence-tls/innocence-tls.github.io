// Загрузка релизов из папки releases/: release.yaml + картинки + данные VNDB.
// Ошибка в release.yaml валит сборку с понятным сообщением, а живой сайт остаётся прошлым.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';
import type { z } from 'astro/zod';
import { schema } from './schema.mjs';
import type { ImageMetadata } from 'astro';
import vndbData from '../data/vndb.json';

export type VndbInfo = {
  title: string;
  alttitle: string | null;
  released: string | null;
  rating: number | null;
  votes: number;
  minutes: number | null;
  developers: string[];
};

export type Release = z.infer<typeof schema> & {
  slug: string;
  banner?: ImageMetadata;
  cover?: ImageMetadata;
  poster?: ImageMetadata; // вертикальный постер для сайта: poster.* > cover.* > постер с VNDB
  shots: ImageMetadata[];
  accent: string;
  imageFile?: string; // путь на диске к баннеру/обложке, для генерации превью
  posterFile?: string; // вертикальный постер для превью ссылки: poster.jpg, обложка или постер с VNDB
  info?: VndbInfo;
};

const yamls = import.meta.glob('/releases/*/release.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const images = import.meta.glob('/releases/*/**/*.{jpg,jpeg,png,webp}', { import: 'default', eager: true }) as Record<string, ImageMetadata>;
// Постеры с VNDB (качает scripts/vndb.mjs, в репо не лежат)
const vndbPosters = import.meta.glob('/src/data/posters/*.jpg', { import: 'default', eager: true }) as Record<string, ImageMetadata>;

// Постер для превью: свой poster.* > обложка > постер с VNDB (качает scripts/vndb.mjs, только без откровенного)
function posterOf(slug: string, coverFile?: string) {
  const dir = path.join(__ROOT__, 'releases', slug);
  const own = fs.readdirSync(dir).find((f) => /^poster\.(jpe?g|png|webp)$/i.test(f));
  if (own) return path.join(dir, own);
  if (coverFile) return coverFile;
  const vndb = path.join(__ROOT__, 'src/data/posters', `${slug}.jpg`);
  return fs.existsSync(vndb) ? vndb : undefined;
}

const slugOf = (p: string) => p.split('/')[2];

// Акцент карточки: самый 'громкий' насыщенный оттенок постера (или баннера), приведённый к яркому и читаемому.
export async function accentOf(file: string): Promise<string> {
  const { data } = await sharp(file).resize(48, 27, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Array(36).fill(0).map(() => ({ w: 0, h: 0 }));
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (d < 0.08) continue;
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const w = s * s * (1 - Math.abs(l - 0.5) * 1.6);
    const bin = bins[Math.floor(h / 10)];
    bin.w += w;
    bin.h += h * w;
  }
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a));
  const hue = best.w ? best.h / best.w : 345;
  return `hsl(${hue.toFixed(0)} 85% 62%)`;
}

const cache = new Map<string, Release>();

const byDate = (a: Release, b: Release) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);

export async function getReleases(): Promise<Release[]> {
  if (cache.size) return [...cache.values()].sort(byDate);
  for (const [p, raw] of Object.entries(yamls)) {
    const slug = slugOf(p);
    const parsed = schema.safeParse(YAML.parse(raw));
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`releases/${slug}/release.yaml:\n${msg}`);
    }
    const own = Object.entries(images).filter(([k]) => slugOf(k) === slug);
    const pick = (name: string) => own.find(([k]) => new RegExp(`/${name}\\.\\w+$`).test(k))?.[1];
    const banner = pick('banner');
    const cover = pick('cover');
    const shots = own.filter(([k]) => k.includes('/shots/')).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([, v]) => v);
    const srcFile = own.find(([k]) => /\/(banner|cover)\.\w+$/.test(k))?.[0];
    const imageFile = srcFile ? path.join(__ROOT__, srcFile) : undefined;
    const coverSrc = own.find(([k]) => /\/cover\.\w+$/.test(k))?.[0];
    const posterFile = posterOf(slug, coverSrc && path.join(__ROOT__, coverSrc));
    const poster = pick('poster') ?? cover ?? vndbPosters[`/src/data/posters/${slug}.jpg`];
    const accentSrc = posterFile ?? imageFile;
    const accent = parsed.data.accent ?? (accentSrc ? await accentOf(accentSrc) : 'hsl(345 85% 62%)');
    const info = parsed.data.vndb ? (vndbData as Record<string, VndbInfo>)[parsed.data.vndb] : undefined;
    cache.set(slug, { ...parsed.data, slug, banner, cover, poster, shots, accent, imageFile, posterFile, info });
  }
  return [...cache.values()].sort(byDate);
}

export const site = YAML.parse(fs.readFileSync(path.join(__ROOT__, 'site.yaml'), 'utf8')) as {
  name: string;
  tagline: string;
  url: string;
  contact?: string;
  socials: Record<string, string>;
  requests?: { tg?: string; vk?: string; boosty?: string };
};

export const censorshipLabel: Record<string, string> = {
  none: 'Без цензуры',
  pixel: 'Пиксельная цензура',
  mosaic: 'Мозаика',
  nosex: 'Без взрослых сцен',
};

export const year = (r: Release) => r.info?.released?.slice(0, 4);

// Основные факты для карточки, героя и страницы релиза
export const facts = (r: Release) =>
  [
    ['Дата выхода', year(r)],
    ['Разработчик', r.info?.developers?.join(', ')],
    ['Длительность', r.length],
  ].filter(([, v]) => v) as [string, string][];

export const fullTitle = (r: Release) => (r.subtitle ? `${r.title}: ${r.subtitle}` : r.title);
