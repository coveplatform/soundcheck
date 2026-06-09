import { posts } from "../src/lib/blog-posts";
import { genrePages } from "../src/lib/genre-pages";
import { alternativePages } from "../src/lib/alternatives";
import { SITE_URL } from "../src/lib/site";

const KEY = "7e347151c740f1f4389aacc10a6f0b7b";
const BASE_URL = SITE_URL;
const HOST = new URL(SITE_URL).host;

const urls = [
  BASE_URL,
  `${BASE_URL}/blog`,
  `${BASE_URL}/discover`,
  `${BASE_URL}/breakthrough`,
  ...posts.map((p) => `${BASE_URL}/blog/${p.slug}`),
  ...genrePages.map((p) => `${BASE_URL}/feedback/${p.slug}`),
  ...alternativePages.map((p) => `${BASE_URL}/alternatives/${p.slug}`),
];

async function submitIndexNow() {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${BASE_URL}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`IndexNow (Bing/Yandex) → ${res.status} (${urls.length} URLs submitted)`);
  urls.forEach((u) => console.log(`  ${u}`));

  if (!res.ok && res.status !== 202) {
    console.error("Unexpected response:", await res.text());
    process.exit(1);
  }
}

// Google deprecated their sitemap ping endpoint in Jan 2024.
// For Google: submit sitemap.xml once in Search Console, and ensure
// it's referenced in robots.txt — Google will re-crawl automatically.

submitIndexNow().catch((err) => {
  console.error(err);
  process.exit(1);
});
