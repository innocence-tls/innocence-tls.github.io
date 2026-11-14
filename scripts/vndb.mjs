// Подтягивает данные с VNDB для всех релизов и кладёт в src/data/vndb.json.
// Если VNDB недоступен, остаётся прошлый кеш и сборка идёт дальше.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/vndb.json');
const REL = path.join(ROOT, 'releases');
const PORTS = path.join(ROOT, 'ports');

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const releases = fs.readdirSync(REL)
  .filter((d) => fs.existsSync(path.join(REL, d, 'release.yaml')))
  .map((d) => ({ slug: d, ...YAML.parse(fs.readFileSync(path.join(REL, d, 'release.yaml'), 'utf8')) }))
  .filter((r) => r.vndb);

// Порты: свой VNDB-id, если порт не привязан к релизу (у привязанного данные берутся у релиза)
const ports = fs.existsSync(PORTS)
  ? fs.readdirSync(PORTS)
      .filter((d) => fs.existsSync(path.join(PORTS, d, 'port.yaml')))
      .map((d) => ({ slug: d, ...YAML.parse(fs.readFileSync(path.join(PORTS, d, 'port.yaml'), 'utf8')) }))
      .filter((p) => p.vndb)
  : [];

const ids = [...new Set([...releases, ...ports].map((r) => r.vndb))];
const fields = 'id,title,alttitle,released,rating,votecount,length_minutes,developers.name,image.url,image.sexual,image.violence';

async function query(chunk) {
  const res = await fetch('https://api.vndb.org/kana/vn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters: ['or', ...chunk.map((id) => ['id', '=', id])], fields, results: 100 }),
  });
  if (!res.ok) throw new Error(`VNDB ${res.status}`);
  return (await res.json()).results;
}

try {
  for (let i = 0; i < ids.length; i += 100) {
    for (const v of await query(ids.slice(i, i + 100))) {
      cache[v.id] = {
        title: v.title,
        alttitle: v.alttitle,
        released: v.released,
        rating: v.rating,
        votes: v.votecount,
        minutes: v.length_minutes,
        developers: v.developers.map((d) => d.name),
        image: v.image,
      };
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
  console.log(`vndb: ${ids.length} тайтлов обновлено`);
} catch (e) {
  console.warn(`vndb: не удалось обновить (${e.message}), беру кеш`);
}

// Обложка с VNDB; откровенная (image.sexual >= 1) сразу сильно размывается, чтобы карточка не была пустой:
// - релизу без своего баннера/обложки кладётся в его папку как cover.jpg;
// - релизу с баннером, но без poster.*, идёт в src/data/posters/ (не в репо) для превью ссылок.
// - порту с собственным VNDB-id и без своей картинки идёт в его папку как cover.jpg.
const POSTERS = path.join(ROOT, 'src/data/posters');
async function download(img) {
  const buf = Buffer.from(await (await fetch(img.url)).arrayBuffer());
  if (img.sexual < 1) return buf;
  return sharp(buf).resize({ width: 400, withoutEnlargement: true }).blur(28).jpeg({ quality: 82 }).toBuffer();
}
for (const r of releases) {
  const dir = path.join(REL, r.slug);
  const files = fs.readdirSync(dir);
  const img = cache[r.vndb]?.image;
  if (!img) continue;
  let out;
  if (!files.some((f) => /^(banner|cover)\.(jpe?g|png|webp)$/i.test(f))) out = path.join(dir, 'cover.jpg');
  else if (!files.some((f) => /^(poster|cover)\.(jpe?g|png|webp)$/i.test(f))) out = path.join(POSTERS, `${r.slug}.jpg`);
  if (!out || fs.existsSync(out)) continue;
  try {
    const buf = await download(img);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buf);
    console.log(`vndb: обложка для ${r.slug}`);
  } catch (e) {
    console.warn(`vndb: обложка ${r.slug} не скачалась (${e.message})`);
  }
}

for (const p of ports) {
  const dir = path.join(PORTS, p.slug);
  const img = cache[p.vndb]?.image;
  const out = path.join(dir, 'cover.jpg');
  if (!img || fs.existsSync(out) || fs.readdirSync(dir).some((f) => /^(poster|cover)\.(jpe?g|png|webp)$/i.test(f))) continue;
  try {
    fs.writeFileSync(out, await download(img));
    console.log(`vndb: обложка для порта ${p.slug}`);
  } catch (e) {
    console.warn(`vndb: обложка порта ${p.slug} не скачалась (${e.message})`);
  }
}
