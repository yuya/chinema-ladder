# Chinemaladder

映画の評判を、はしごする。

作品名を1回入れるだけで、国内の映画レビューサイト・ムビチケ・SNS・配信サービスの検索結果へ飛べるリンク集。

## 構成
- `index.html` … サイト本体（1ファイル完結。ライブラリなし）
- `worker/worker.js` … TMDB 中継（Cloudflare Workers）。https://cinema-ladder-api.twilightwind.workers.dev で稼働。サジェストに使う。コードを変えたら Cloudflare の画面で貼り直して Deploy
- `data/trending.json` … 話題作TOP10。GitHub Actions が毎日自動更新（手で編集しない）
- `data/titles.json` … 検索ボックスのサジェスト用の作品一覧（数千本）。Actions が毎日自動更新
- `scripts/fetch-trending.mjs` / `scripts/fetch-titles.mjs` … 上の2つの JSON を作るスクリプト
- `scripts/fetch-icons.mjs` … ファビコンを取得するスクリプト（サイトを増やしたらここにも追加）
- `.github/workflows/trending.yml` … 毎日 6:17（日本時間）に上のスクリプトを実行。定期実行は既定ブランチの設定しか動かないため、このファイルは main にも置く
- `icons/` … 各サイトのファビコンの元画像。Actions が足りない分だけ取得し、`scripts/inline-icons.py` が index.html の CSS に埋め込む（通信回数を減らすため。表示には icons/ を直接使わない）
- `.nojekyll` … GitHub Pages で Jekyll 変換を無効化

## ブランチ
- `staging` … 確認用。GitHub Pages で公開
- `main` … 本番用（今後）

## TMDB
話題作TOP10は、リポジトリの Secret `TMDB_TOKEN` を使って Actions が取得するので、訪問者はトークン不要。

サジェストは Cloudflare Workers の中継（`worker/`）経由で TMDB の検索を使う。中継が応答しないときは `data/titles.json` から候補を出す。トークンはブラウザに一切置かない。

This product uses the TMDB API but is not endorsed or certified by TMDB.
