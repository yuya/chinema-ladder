// brand/icon.svg（元絵）から、ファビコン・ホーム画面用・PWA 用のアイコンを書き出す。
// アイコンの形や色を変えたら `node scripts/build-brand.mjs` を実行してコミットする。
// 必要なもの: playwright（画像の書き出し）、python3 + Pillow（favicon.ico の作成）
import { createRequire } from "node:module";
// playwright はグローバルに入っているものも使えるよう require で読む（NODE_PATH を見るため）
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const src = await readFile("brand/icon.svg", "utf8");
// 角丸なし・全面黒（iOS や Android が自分で角を丸めるため）
const square = src.replace(/rx="7"/, 'rx="0"');
// マスカブル用：Android が円などで切り抜いても絵が欠けないよう、中身を 80% に縮める
const maskable = square.replace(/(<rect width="32" height="32" rx="0" fill="#141418"\/>)(.*)<\/svg>/s,
  '$1<g transform="translate(3.2 3.2) scale(.8)">$2</g></svg>');

const browser = await chromium.launch();
const page = await browser.newPage();
async function png(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: file, omitBackground: true });
}
await writeFile("favicon.svg", src);
await png(src, 16, "brand/favicon-16.png");
await png(src, 32, "brand/favicon-32.png");
await png(src, 48, "brand/favicon-48.png");
await png(square, 180, "apple-touch-icon.png");
await png(square, 192, "brand/icon-192.png");
await png(square, 512, "brand/icon-512.png");
await png(maskable, 512, "brand/icon-maskable-512.png");
await browser.close();

// favicon.ico（古いブラウザや、/favicon.ico を自動で取りに来るもの向け）
execFileSync("python3", ["-c", `
from PIL import Image
imgs=[Image.open(f"brand/favicon-{s}.png").convert("RGBA") for s in (16,32,48)]
imgs[2].save("favicon.ico", sizes=[(16,16),(32,32),(48,48)], append_images=imgs[:2])
`]);
console.log("アイコン一式を書き出しました");
