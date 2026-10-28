// 日本で上映中・公開予定の映画を TMDB から取得し、人気上位10本を data/trending.json に書き出す。
// GitHub Actions から毎日実行する。トークンはリポジトリの Secret（TMDB_TOKEN）から読む。
import { writeFile, mkdir } from "node:fs/promises";

const TOKEN = process.env.TMDB_TOKEN;
if (!TOKEN) { console.error("TMDB_TOKEN が設定されていません"); process.exit(1); }

const get = async path => {
  const r = await fetch("https://api.themoviedb.org/3" + path, {
    headers: { Authorization: "Bearer " + TOKEN, accept: "application/json" },
  });
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
  return r.json();
};

// 日本語タイトルが未登録だと原題（タミル語など）が返るので、日本語・英数字以外を含むタイトルは除外
const readable = t => !!t && !/[^\u0000-\u024F\u2000-\u206F\u2E80-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(t);

const q = "?language=ja-JP&region=JP&page=";
const pages = await Promise.all([
  get("/movie/now_playing" + q + 1), get("/movie/now_playing" + q + 2), get("/movie/upcoming" + q + 1),
]);
const map = new Map();
for (const m of pages.flatMap(p => p.results || [])) {
  if (!readable(m.title)) continue;
  map.set(m.id, { id: m.id, title: m.title, original: m.original_title, date: m.release_date, poster: m.poster_path, pop: m.popularity });
}
const items = [...map.values()].sort((a, b) => b.pop - a.pop).slice(0, 10);
if (items.length < 3) throw new Error("取得できた作品が少なすぎるため更新を中止しました");

await mkdir("data", { recursive: true });
await writeFile("data/trending.json", JSON.stringify({ updated: new Date().toISOString(), items }, null, 1) + "\n");
console.log(items.map((m, i) => `${i + 1}. ${m.title}`).join("\n"));
