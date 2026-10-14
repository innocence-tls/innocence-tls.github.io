// Иконки инлайном при сборке: бренды из simple-icons, остальное из lucide.
import fs from 'node:fs';
import path from 'node:path';
import { siTelegram, siVk, siBoosty, siGoogledrive, siAndroid, siMega } from 'simple-icons';

const brand = (i: { path: string; hex: string }) => ({
  svg: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${i.path}"/></svg>`,
  color: `#${i.hex}`,
});

const lucide = (name: string) => {
  const raw = fs.readFileSync(path.join(__ROOT__, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8');
  const svg = raw.replace(/<!--.*?-->/gs, '').trim();
  // Размеры убираем только у самого <svg>, у фигур внутри они нужны
  return svg.replace(/<svg[^>]*>/, (tag) => tag.replace(/\s(width|height|class)="[^"]*"/g, '').replace('<svg', '<svg aria-hidden="true"'));
};

export const brands = {
  telegram: brand(siTelegram),
  vk: brand(siVk),
  boosty: brand(siBoosty),
  gdrive: brand(siGoogledrive),
  android: brand(siAndroid),
  mega: brand(siMega),
};

const names = {
  pc: 'monitor',
  game: 'gamepad-2',
  patch: 'languages',
  chat: 'messages-square',
  donate: 'heart',
  search: 'search',
  clock: 'clock',
  calendar: 'calendar',
  star: 'star',
  external: 'external-link',
  download: 'download',
  link: 'link',
  disk: 'hard-drive-download',
  eye: 'eye-off',
  arrow: 'arrow-right',
  back: 'arrow-left',
  sparkles: 'sparkles',
  code: 'building-2',
  info: 'info',
  x: 'x',
};

export const icons = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, lucide(v)])) as Record<keyof typeof names, string>;

export const socialMeta: Record<string, { label: string; svg: string; color: string }> = {
  telegram: { label: 'Telegram', ...brands.telegram },
  chat: { label: 'Чат', svg: icons.chat, color: '#26a5e4' },
  vk: { label: 'ВКонтакте', ...brands.vk },
  boosty: { label: 'Boosty', ...brands.boosty },
  donate: { label: 'Поддержать', svg: icons.donate, color: '#ff4d6d' },
};

export const hostMeta: Record<string, { label: string; svg: string; color: string }> = {
  gdrive: { label: 'Google Диск', ...brands.gdrive },
  tg: { label: 'Telegram', ...brands.telegram },
  yadisk: { label: 'Яндекс Диск', svg: icons.disk, color: '#fc3f1d' },
  mega: { label: 'MEGA', ...brands.mega },
  boosty: { label: 'Boosty', ...brands.boosty },
  mail: { label: 'Облако Mail', svg: icons.disk, color: '#0077ff' },
  other: { label: 'Скачать', svg: icons.download, color: '#9aa0b4' },
};

export const postMeta: Record<string, { label: string; svg: string; color: string }> = {
  tg: { label: 'Пост в Telegram', ...brands.telegram },
  vk: { label: 'Пост во ВКонтакте', ...brands.vk },
  boosty: { label: 'Пост на Boosty', ...brands.boosty },
};

export const kindMeta = {
  game: { label: 'Игра с русификатором', hint: 'ПК, русификатор уже установлен', svg: icons.game },
  patch: { label: 'Русификатор', hint: 'Если игра уже есть', svg: icons.patch },
  android: { label: 'Android-версия', hint: 'APK, ставится как обычное приложение', svg: brands.android.svg },
} as const;
