// Схема release.yaml. Общая для сборки (src/lib/releases.ts) и локальной админки.
import { z } from 'astro/zod';

const link = z.object({
  host: z.enum(['gdrive', 'tg', 'yadisk', 'mega', 'boosty', 'mail', 'other']),
  url: z.string().url(),
  label: z.string().optional(),
});

export const schema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  original: z.string(),
  vndb: z.string().regex(/^v\d+$/, 'vndb должен быть вида v12345').optional(),
  status: z.enum(['released', 'wip', 'planned']),
  progress: z.number().min(0).max(100).optional(),
  date: z.coerce.date().optional(),
  length: z.string().optional(),
  platforms: z.array(z.enum(['pc', 'android'])).default([]),
  censorship: z.enum(['none', 'pixel', 'mosaic', 'nosex']).optional(),
  favorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  desc: z.string().optional(),
  note: z.string().optional(),
  posts: z
    .object({ tg: z.string().url().optional(), vk: z.string().url().optional(), boosty: z.string().url().optional() })
    .default({}),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  downloads: z
    .object({
      game: z.array(link).optional(),
      patch: z.array(link).optional(),
      android: z.array(link).optional(),
    })
    .default({}),
});

export const hosts = link.shape.host.options;

// ---------- порты ----------
// ports/<slug>/port.yaml: перенос игры на другую платформу (Android-версия, ПК с консоли и т.п.)

export const portPlatforms = ['pc', 'android', 'switch', 'ps3', 'ps4', 'ps5', 'psp', 'vita', 'ios'];
const platform = z.enum(portPlatforms);

export const portSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    original: z.string().optional(),
    release: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'имя папки релиза').optional(),
    vndb: z.string().regex(/^v\d+$/, 'vndb должен быть вида v12345').optional(),
    date: z.coerce.date().optional(),
    to: z.array(platform).min(1, 'выбери, на что порт'),
    from: platform.default('pc'),
    engine: z.string().optional(),
    translation: z.object({ by: z.string().optional(), url: z.string().url().optional() }).optional(),
    features: z.array(z.string()).default([]),
    note: z.string().optional(),
    posts: z
      .object({ tg: z.string().url().optional(), vk: z.string().url().optional(), boosty: z.string().url().optional() })
      .default({}),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    downloads: z.object({ game: z.array(link).optional(), android: z.array(link).optional() }).default({}),
  })
  .superRefine((d, ctx) => {
    if (!d.title?.trim() && !d.release) ctx.addIssue({ code: 'custom', path: ['title'], message: 'нужно название или связанный релиз' });
  });
