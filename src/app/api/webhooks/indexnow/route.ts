import { NextRequest, NextResponse } from "next/server";
import { posts } from "@/lib/blog-posts";

const KEY = "7e347151c740f1f4389aacc10a6f0b7b";
const HOST = "mixreflect.com";
const BASE_URL = `https://${HOST}`;

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.INDEXNOW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = [
    BASE_URL,
    `${BASE_URL}/blog`,
    `${BASE_URL}/discover`,
    `${BASE_URL}/breakthrough`,
    ...posts.map((p) => `${BASE_URL}/blog/${p.slug}`),
  ];

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

  return NextResponse.json({ submitted: urls.length, indexNowStatus: res.status });
}
