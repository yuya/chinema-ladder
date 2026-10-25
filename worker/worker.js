// Cinema Ladder 用 TMDB 中継（Cloudflare Workers）
// 目的: TMDB のトークンをブラウザやアプリに置かず、サーバー側だけに持たせる。
// 使い方:
//   1. Cloudflare ダッシュボード → Workers & Pages → Create → 「Hello World」で作成し、このコードを貼り付けて Deploy
//   2. Settings → Variables and Secrets → Secret として TMDB_TOKEN（API Read Access Token）を追加
//   3. 下の ALLOWED_ORIGINS に自分のサイトのURLを入れる
//   4. index.html の TMDB_PROXY に「https://<worker名>.<サブドメイン>.workers.dev/search」を設定

const ALLOWED_ORIGINS = ["https://example.com", "http://localhost:8000"]; // 自分のサイトに書き換え

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const cors = { "Access-Control-Allow-Origin": allow, "Vary": "Origin" };

    const url = new URL(req.url);
    const tmdb = path => fetch("https://api.themoviedb.org/3" + path, {
      headers: { Authorization: "Bearer " + env.TMDB_TOKEN, accept: "application/json" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

    // 日本で上映中＋公開予定の作品を人気順に上位10本
    if (url.pathname === "/trending") {
      try {
        const q = "?language=ja-JP&region=JP&page=";
        // 日本語タイトルが未登録だと原題（タミル語など）が返るので、日本語・英数字以外を含むタイトルは除外
        const readable = t => !!t && !/[^\u0000-ɏ -⁯⺀-ヿ㐀-鿿豈-﫿＀-￯]/.test(t);
        const pages = await Promise.all([tmdb("/movie/now_playing" + q + 1), tmdb("/movie/now_playing" + q + 2), tmdb("/movie/upcoming" + q + 1)]);
        const map = new Map();
        pages.flatMap(p => p.results || []).filter(m => readable(m.title)).forEach(m => map.set(m.id, {
          id: m.id, title: m.title, original: m.original_title, date: m.release_date, poster: m.poster_path, pop: m.popularity,
        }));
        const top = [...map.values()].sort((a, b) => b.pop - a.pop).slice(0, 10);
        return json(top, { ...cors, "Cache-Control": "public, max-age=3600" });
      } catch (e) {
        return json({ error: String(e.message) }, cors, 502);
      }
    }

    if (url.pathname !== "/search") return new Response("Not found", { status: 404, headers: cors });

    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    if (!q) return json([], cors);

    const api = "https://api.themoviedb.org/3/search/movie?query=" + encodeURIComponent(q) +
      "&language=ja-JP&region=JP&include_adult=false&page=1";
    const r = await fetch(api, {
      headers: { Authorization: "Bearer " + env.TMDB_TOKEN, accept: "application/json" },
      cf: { cacheTtl: 3600, cacheEverything: true }, // 同じ検索語は1時間キャッシュして TMDB への負荷を減らす
    });
    if (!r.ok) return json({ error: r.status }, cors, 502);

    const j = await r.json();
    const out = (j.results || []).slice(0, 8).map(m => ({
      id: m.id, title: m.title, original: m.original_title, date: m.release_date, poster: m.poster_path,
    }));
    return json(out, { ...cors, "Cache-Control": "public, max-age=3600" });
  },
};

function json(body, headers, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
