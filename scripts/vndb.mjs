// Подтягивает данные с VNDB для всех релизов и кладёт в src/data/vndb.json.
// Если VNDB недоступен, остаётся прошлый кеш и сборка идёт дальше.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/vndb.json');
const REL = path.join(ROOT, 'releases');

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const releases = fs.readdirSync(REL)
  .filter((d) => fs.existsSync(path.join(REL, d, 'release.yaml')))
  .map((d) => ({ slug: d, ...YAML.parse(fs.readFileSync(path.join(REL, d, 'release.yaml'), 'utf8')) }))
  .filter((r) => r.vndb);

const ids = [...new Set(releases.map((r) => r.vndb))];
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

// Обложка с VNDB нужна только релизам без своего баннера, и только если она без откровенного.
for (const r of releases) {
  const dir = path.join(REL, r.slug);
  const has = fs.readdirSync(dir).some((f) => /^(banner|cover)\.(jpe?g|png|webp)$/i.test(f));
  const img = cache[r.vndb]?.image;
  if (has || !img || img.sexual >= 1) continue;
  try {
    const buf = Buffer.from(await (await fetch(img.url)).arrayBuffer());
    fs.writeFileSync(path.join(dir, 'cover.jpg'), buf);
    console.log(`vndb: обложка для ${r.slug}`);
  } catch (e) {
    console.warn(`vndb: обложка ${r.slug} не скачалась (${e.message})`);
  }
}
