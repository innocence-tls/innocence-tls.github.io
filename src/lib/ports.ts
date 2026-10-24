// Загрузка портов из папки ports/: port.yaml + poster.jpg (или обложка / постер связанного релиза).
// Название, оригинал и VNDB берутся у связанного релиза (release: <папка>), если не заданы у порта.
import path from 'node:path';
import YAML from 'yaml';
import type { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';
import { portSchema } from './schema.mjs';
import { getReleases, accentOf, type Release, type VndbInfo } from './releases';
import vndbData from '../data/vndb.json';

export type Port = Omit<z.infer<typeof portSchema>, 'title' | 'original' | 'release'> & {
  slug: string;
  title: string;
  original: string;
  rel?: Release; // связанный релиз
  poster?: ImageMetadata;
  accent: string;
  info?: VndbInfo;
};

const yamls = import.meta.glob('/ports/*/port.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const images = import.meta.glob('/ports/*/*.{jpg,jpeg,png,webp}', { import: 'default', eager: true }) as Record<string, ImageMetadata>;

const slugOf = (p: string) => p.split('/')[2];

let cache: Port[] | undefined;

export async function getPorts(): Promise<Port[]> {
  if (cache) return cache;
  const releases = await getReleases();
  const list: Port[] = [];
  for (const [p, raw] of Object.entries(yamls)) {
    const slug = slugOf(p);
    const parsed = portSchema.safeParse(YAML.parse(raw));
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`ports/${slug}/port.yaml:\n${msg}`);
    }
    const { release: relSlug, title, original, vndb, ...rest } = parsed.data;
    const rel = relSlug ? releases.find((r) => r.slug === relSlug) : undefined;
    if (relSlug && !rel) throw new Error(`ports/${slug}/port.yaml:\n  release: нет релиза releases/${relSlug}`);
    const own = Object.entries(images).filter(([k]) => slugOf(k) === slug);
    const pick = (name: string) => own.find(([k]) => new RegExp(`/${name}\\.\\w+$`).test(k));
    const ownPoster = pick('poster') ?? pick('cover');
    const poster = ownPoster?.[1] ?? rel?.poster;
    const posterFile = ownPoster ? path.join(__ROOT__, ownPoster[0]) : rel?.posterFile;
    const accent = rest.accent ?? (posterFile ? await accentOf(posterFile) : 'hsl(150 70% 55%)');
    const id = vndb ?? rel?.vndb;
    list.push({
      ...rest,
      slug,
      title: title?.trim() || rel?.title || slug,
      subtitle: rest.subtitle ?? (title?.trim() ? undefined : rel?.subtitle),
      original: original?.trim() || rel?.original || '',
      vndb: id,
      rel,
      poster,
      accent,
      info: id ? (vndbData as Record<string, VndbInfo>)[id] ?? rel?.info : undefined,
    });
  }
  // Новые сверху; в один день выше тот, чей пост в канале новее (больший номер)
  const postNo = (x: Port) => +(x.posts.tg?.match(/(\d+)\/?$/)?.[1] ?? 0);
  cache = list.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || postNo(b) - postNo(a));
  return cache;
}
