// Цвет тега: оттенок берётся из названия (один и тот же тег всегда одного цвета), общий для сайта и превью ссылки.
const hash = (s: string) => [...s.toLowerCase()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function hsl(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const rgba = ([r, g, b]: number[], a: number) => `rgba(${r},${g},${b},${a})`;

// Золотой угол разводит соседние хеши по кругу, оттенки не слипаются
export function tagColor(tag: string) {
  const h = (hash(tag) * 137.508) % 360;
  const h2 = (h + 38) % 360;
  return {
    bg: `linear-gradient(135deg, ${rgba(hsl(h, 80, 58), 0.42)}, ${rgba(hsl(h2, 80, 58), 0.42)})`,
    border: rgba(hsl(h, 85, 68), 0.55),
    fg: rgba(hsl(h, 100, 88), 1),
  };
}

// Для атрибута style на сайте
export function tagStyle(tag: string) {
  const c = tagColor(tag);
  return `--tbg:${c.bg};--tbd:${c.border};--tfg:${c.fg}`;
}
