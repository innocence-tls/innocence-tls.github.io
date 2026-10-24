// Иконки инлайном при сборке: бренды из simple-icons, остальное из lucide.
import fs from 'node:fs';
import path from 'node:path';
import { siTelegram, siVk, siBoosty, siGoogledrive, siAndroid, siMega, siPlaystation, siIos } from 'simple-icons';

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
  playstation: brand(siPlaystation),
  ios: brand(siIos),
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

// Логотип Windows (четыре окна): в simple-icons его нет
const windows = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.55l7.5-1.03v6.9H3zm8.5-1.17L21 3v8.42h-9.5zM3 12.58h7.5v6.9L3 18.45zm8.5 0H21V21l-9.5-1.3z"/></svg>';

// Nintendo Switch: в simple-icons его нет, два Joy-Con нарисованы руками
const switchSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.5 3h3v18h-3a4.5 4.5 0 0 1-4.5-4.5v-9A4.5 4.5 0 0 1 7.5 3zm-1.6 4.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM13.5 3h3A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-3zm3.1 8.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/></svg>';

export const icons = {
  ...(Object.fromEntries(Object.entries(names).map(([k, v]) => [k, lucide(v)])) as Record<keyof typeof names, string>),
  windows,
};

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

// Платформы портов: откуда и куда. Цвет у каждой свой (ПК синий, Android зелёный).
const ps = (label: string) => ({ label, ...brands.playstation, color: '#4f8dff' });
export const platformMeta: Record<string, { label: string; svg: string; color: string }> = {
  pc: { label: 'ПК', svg: icons.windows, color: '#7aa7ff' },
  android: { label: 'Android', svg: brands.android.svg, color: '#3ddc84' },
  switch: { label: 'Switch', svg: switchSvg, color: '#ff5a5f' },
  ps3: ps('PS3'),
  ps4: ps('PS4'),
  ps5: ps('PS5'),
  psp: ps('PSP'),
  vita: ps('PS Vita'),
  ios: { label: 'iOS', ...brands.ios, color: '#d6d8e4' },
};

// Подписи загрузок на странице портов
export const portKindMeta = {
  android: { label: 'Android-версия', hint: 'APK, ставится как обычное приложение', svg: brands.android.svg },
  game: { label: 'Версия для ПК', hint: 'готовая игра на русском', svg: icons.windows },
} as const;
