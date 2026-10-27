// サジェスト用の作品名一覧を TMDB から作り、data/titles.json に書き出す。
// 訪問者がトークンなしで候補を出せるように、GitHub Actions から毎日実行する。
// 人気順・評価数順に、邦画と全体からそれぞれ集めて重複を除く。
import { writeFile, mkdir } from "node:fs/promises";

const TOKEN = process.env.TMDB_TOKEN;
if (!TOKEN) { console.error("TMDB_TOKEN が設定されていません"); process.exit(1); }

const get = async (path, tries = 3) => {
  for (let i = 0; ; i++) {
    const r = await fetch("https://api.themoviedb.org/3" + path, {
      headers: { Authorization: "Bearer " + TOKEN, accept: "application/json" },
    });
    if (r.ok) return r.json();
    if (i + 1 >= tries || (r.status !== 429 && r.status < 500)) throw new Error(`${path} → HTTP ${r.status}`);
    await new Promise(res => setTimeout(res, 1000 * (i + 1)));
  }
};
const readable = t => !!t && !/[^\u0000-ɏ -⁯⺀-ヿ㐀-鿿豈-﫿＀-￯]/.test(t);

const base = "language=ja-JP&include_adult=false&include_video=false";
const lists = [
  // [パス, ページ数] 上にあるものほど候補で優先される
  ["/movie/now_playing?language=ja-JP&region=JP", 3],
  ["/movie/upcoming?language=ja-JP&region=JP", 3],
  [`/discover/movie?${base}&with_original_language=ja&sort_by=popularity.desc`, 50],
  [`/discover/movie?${base}&sort_by=popularity.desc&vote_count.gte=50`, 50],
  [`/discover/movie?${base}&with_original_language=ja&sort_by=vote_count.desc`, 30],
  [`/discover/movie?${base}&sort_by=vote_count.desc`, 50],
];
const jobs = lists.flatMap(([p, n], li) => Array.from({ length: n }, (_, i) => ({ li, page: i + 1, url: `${p}&page=${i + 1}` })));

// 同時に8件ずつ取得
const results = new Array(jobs.length);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < jobs.length) {
    const k = next++;
    try { results[k] = (await get(jobs[k].url)).results || []; }
    catch (e) { console.warn(e.message); results[k] = []; }
  }
}));

const map = new Map();
for (const list of results) for (const m of list) {
  if (map.has(m.id) || !readable(m.title)) continue;
  const row = [m.id, m.title, (m.release_date || "").slice(0, 4), m.poster_path || ""];
  if (m.original_title && m.original_title !== m.title && readable(m.original_title)) row.push(m.original_title);
  map.set(m.id, row);
}
const items = [...map.values()];
if (items.length < 500) throw new Error(`取得できた作品が少なすぎるため更新を中止しました（${items.length}件）`);

await mkdir("data", { recursive: true });
// 1行1作品にして、差分を見やすくする
const body = "{\"updated\":" + JSON.stringify(new Date().toISOString()) +
  ",\"fields\":[\"id\",\"title\",\"year\",\"poster\",\"original\"],\"items\":[\n" + items.map(r => JSON.stringify(r)).join(",\n") + "\n]}\n";
await writeFile("data/titles.json", body);
console.log(`${items.length} 作品 / ${(Buffer.byteLength(body) / 1024).toFixed(0)} KB`);
