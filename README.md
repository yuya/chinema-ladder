# Cinema Ladder

映画の評判を、はしごする。

作品名を1回入れるだけで、国内の映画レビューサイト・ムビチケ・SNS・配信サービスの検索結果へ飛べるリンク集。

## 構成
- `index.html` … サイト本体（1ファイル完結。ライブラリなし）
- `worker/worker.js` … 本番用の TMDB 中継（Cloudflare Workers）。トークンをブラウザに置かないため
- `data/trending.json` … 話題作TOP10。GitHub Actions が毎日自動更新（手で編集しない）
- `scripts/fetch-trending.mjs` … 上の JSON を作るスクリプト
- `.github/workflows/trending.yml` … 毎日 6:17（日本時間）に上のスクリプトを実行
- `.nojekyll` … GitHub Pages で Jekyll 変換を無効化

## ブランチ
- `staging` … 確認用。GitHub Pages で公開
- `main` … 本番用（今後）

## TMDB
話題作TOP10は、リポジトリの Secret `TMDB_TOKEN` を使って Actions が取得するので、訪問者はトークン不要。

作品のサジェストは、いまは開発用としてページ下の「開発者向け：TMDB の設定」にトークンを入れたときだけ動く。誰でも使えるようにするには `worker/` を Cloudflare Workers に置き、`index.html` の `TMDB_PROXY` に URL を設定する。

This product uses the TMDB API but is not endorsed or certified by TMDB.
