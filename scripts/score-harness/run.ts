/**
 * Golden-set harness — regression-test the scorer against tracks with known
 * expectations. Features are cached on disk after the first fetch, so prompt /
 * engine iterations re-run ONLY the LLM stages (fast + cheap, no worker time).
 *
 *   npx tsx scripts/score-harness/run.ts                  # v2, all cached-or-fetch
 *   npx tsx scripts/score-harness/run.ts --engine v1      # legacy single-prompt
 *   npx tsx scripts/score-harness/run.ts --only blinding-lights,strobe
 *   npx tsx scripts/score-harness/run.ts --runs 3         # stability check
 *   npx tsx scripts/score-harness/run.ts --no-listen      # v2 without the audio-LLM pass
 *   npx tsx scripts/score-harness/run.ts --fresh          # refetch features (uses the PROD worker!)
 *   npx tsx scripts/score-harness/run.ts --save v2-baseline
 *
 * NOTE: fetching fresh features goes through the PROD audio worker, which
 * serializes analyses — a full fresh run occupies its slot for ~1 min/track.
 * Run fresh fetches off-peak; cached runs touch nothing.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { GOLDEN_SET, type GoldenTrack } from "./golden-set";

const CACHE_DIR = path.join(__dirname, ".cache");
const RESULTS_DIR = path.join(__dirname, ".results");

type Args = {
  engine: "v1" | "v2";
  only: string[] | null;
  runs: number;
  listen: boolean;
  fresh: boolean;
  limit: number | null;
  save: string | null;
};

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const i = a.indexOf(flag);
    return i >= 0 && a[i + 1] && !a[i + 1].startsWith("--") ? a[i + 1] : null;
  };
  return {
    engine: get("--engine") === "v1" ? "v1" : "v2",
    only: get("--only")?.split(",").map((s) => s.trim()) ?? null,
    runs: Math.max(1, Number(get("--runs") ?? 1) || 1),
    listen: !a.includes("--no-listen"),
    fresh: a.includes("--fresh"),
    limit: get("--limit") ? Number(get("--limit")) : null,
    save: get("--save"),
  };
}

type RunResult = {
  id: string;
  kind: string;
  expect: [number, number];
  scores: number[];
  dims: Record<string, number>[];
  verdicts: string[];
  grounded: boolean;
  listened: boolean;
  priors: { production: number | null; structure: number | null } | null;
};

async function featuresFor(t: GoldenTrack, fresh: boolean) {
  const cachePath = path.join(CACHE_DIR, `${t.id}.json`);
  if (!fresh && fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    } catch {
      /* refetch */
    }
  }
  const { acquireAudioFeatures } = await import("@/lib/audio-analysis");
  process.stdout.write(`  fetching features via worker… `);
  const t0 = Date.now();
  const acquired = await acquireAudioFeatures(t.url, { deep: false });
  const features = acquired && !("tooLong" in acquired) ? acquired : null;
  console.log(
    acquired && "tooLong" in acquired
      ? "REFUSED (over the length cap)"
      : features
        ? `ok (${Math.round((Date.now() - t0) / 1000)}s)`
        : "FAILED (ungrounded)"
  );
  if (features) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(features));
  }
  return features;
}

function fmtBand(b: [number, number]) {
  return `${String(b[0]).padStart(2)}-${String(b[1]).padEnd(3)}`;
}

async function main() {
  const args = parseArgs();
  process.env.SCORE_ENGINE = args.engine;
  if (!args.listen) process.env.SCORE_LISTEN = "0";

  let set = GOLDEN_SET.filter((t) => t.url);
  if (args.only) set = set.filter((t) => args.only!.includes(t.id));
  if (args.limit) set = set.slice(0, args.limit);
  if (!set.length) {
    console.error("no tracks selected");
    process.exit(1);
  }

  console.log(
    `harness: engine=${args.engine} listen=${args.listen} runs=${args.runs} tracks=${set.length}\n`
  );

  const { generateReport } = await import("@/lib/score-report-ai");
  const results: RunResult[] = [];

  for (const t of set) {
    console.log(`▸ ${t.id}  [${t.kind}]  "${t.title}"`);
    const features = await featuresFor(t, args.fresh);
    const r: RunResult = {
      id: t.id,
      kind: t.kind,
      expect: t.expect,
      scores: [],
      dims: [],
      verdicts: [],
      grounded: features != null,
      listened: false,
      priors: null,
    };
    for (let i = 0; i < args.runs; i++) {
      const rep = await generateReport(
        { trackTitle: t.title, artist: t.artist ?? null, genre: t.genre, notes: null, features },
        {}
      );
      r.scores.push(rep.score);
      r.dims.push({
        hook: rep.hookScore,
        prod: rep.productionScore,
        ret: rep.retentionScore,
        emo: rep.emotionalScore,
        com: rep.commercialScore,
      });
      r.verdicts.push(rep.verdict);
      if (rep.evidence) {
        r.listened = rep.evidence.listen != null;
        r.priors = {
          production: rep.evidence.priors.production,
          structure: rep.evidence.priors.structure,
        };
      }
      const d = r.dims[r.dims.length - 1];
      const inBand = rep.score >= t.expect[0] && rep.score <= t.expect[1];
      console.log(
        `  run ${i + 1}: ${String(rep.score).padStart(3)} ${inBand ? "✓" : "✗ OUT"}  expect ${fmtBand(t.expect)}  ` +
          `dims h${d.hook} p${d.prod} r${d.ret} e${d.emo} c${d.com}  ${rep.verdict}` +
          `${r.listened ? "  [heard]" : ""}${r.grounded ? "" : "  [UNGROUNDED]"}`
      );
    }
    results.push(r);
  }

  // ── summary ──
  const finals = results.map((r) => ({
    id: r.id,
    kind: r.kind,
    score: Math.round(r.scores.reduce((s, x) => s + x, 0) / r.scores.length),
    spreadRuns: Math.max(...r.scores) - Math.min(...r.scores),
    inBand:
      r.scores.every((s) => s >= r.expect[0] && s <= r.expect[1]),
  }));
  const scores = finals.map((f) => f.score);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const sd = Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length);
  const buckets = [0, 0, 0, 0, 0, 0]; // <50, 50s, 60s, 70s, 80s, 90+
  for (const s of scores)
    buckets[s < 50 ? 0 : s < 60 ? 1 : s < 70 ? 2 : s < 80 ? 3 : s < 90 ? 4 : 5]++;

  console.log(`\n══ summary (engine=${args.engine}, listen=${args.listen}) ══`);
  console.log(
    `tracks ${finals.length} · mean ${mean.toFixed(1)} · sd ${sd.toFixed(1)} · range ${Math.min(...scores)}-${Math.max(...scores)} · in-band ${finals.filter((f) => f.inBand).length}/${finals.length}`
  );
  console.log(
    `histogram  <50:${buckets[0]}  50s:${buckets[1]}  60s:${buckets[2]}  70s:${buckets[3]}  80s:${buckets[4]}  90+:${buckets[5]}`
  );
  if (args.runs > 1) {
    const worst = Math.max(...finals.map((f) => f.spreadRuns));
    console.log(`stability  worst run-to-run spread: ±${worst}`);
  }
  for (const f of finals.filter((x) => !x.inBand)) {
    const r = results.find((x) => x.id === f.id)!;
    console.log(`  ✗ ${f.id} [${f.kind}]: got ${r.scores.join("/")}, expected ${fmtBand(r.expect)}`);
  }

  if (args.save) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    const out = path.join(RESULTS_DIR, `${args.save}.json`);
    fs.writeFileSync(
      out,
      JSON.stringify({ when: new Date().toISOString(), args, results }, null, 2)
    );
    console.log(`\nsaved → ${out}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
