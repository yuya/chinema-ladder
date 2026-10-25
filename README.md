# chinema-ladder（ミルマエ）

作品名を1回入れるだけで、国内の映画レビューサイト・ムビチケ・SNS・配信サービスの検索結果へ飛べるリンク集。

## 構成
- `index.html` … サイト本体（1ファイル完結。ライブラリなし）
- `worker/worker.js` … 本番用の TMDB 中継（Cloudflare Workers）。トークンをブラウザに置かないため
- `.nojekyll` … GitHub Pages で Jekyll 変換を無効化

## ブランチ
- `staging` … 確認用。GitHub Pages で公開
- `main` … 本番用（今後）

## TMDB
作品のサジェストと話題作 TOP10 に TMDB API を使用。ページ下の「TMDB の設定」に API Read Access Token を入れると動く（トークンはそのブラウザにだけ保存）。

This product uses the TMDB API but is not endorsed or certified by TMDB.
