#!/usr/bin/env node
/**
 * scripts/check-coverage.js
 *
 * CI coverage gate — fails if any metric drops more than THRESHOLD pts below baseline.
 * Usage: node scripts/check-coverage.js [--threshold 2]
 *
 * Exit codes:
 *   0  All metrics pass
 *   1  One or more metrics dropped below threshold
 *   2  Required file not found (coverage-summary.json or coverage-baseline.json)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SUMMARY_PATH = path.join(ROOT, 'coverage', 'coverage-summary.json');
const BASELINE_PATH = path.join(ROOT, 'coverage-baseline.json');

// Parse --threshold flag (default: 2 pp)
const thresholdIdx = process.argv.indexOf('--threshold');
const THRESHOLD = thresholdIdx !== -1 ? parseFloat(process.argv[thresholdIdx + 1]) : 2;

const METRICS = ['lines', 'statements', 'functions', 'branches'];

// ── Load files ──────────────────────────────────────────────────────────────
if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`❌ Coverage summary not found: ${SUMMARY_PATH}`);
  console.error('   Run `npm run test:coverage` first.');
  process.exit(2);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error(`❌ Baseline file not found: ${BASELINE_PATH}`);
  console.error('   Create coverage-baseline.json or run this script with --update-baseline.');
  process.exit(2);
}

const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const current = summary.total;

// ── Check each metric ────────────────────────────────────────────────────────
let failed = false;
const rows = [];

for (const metric of METRICS) {
  const base = baseline[metric];
  const now = current[metric].pct;
  const delta = now - base;
  const status = delta < -THRESHOLD ? '❌ FAIL' : delta >= 0 ? '✅ PASS' : '⚠️  WARN';
  if (delta < -THRESHOLD) failed = true;

  const sign = delta >= 0 ? '+' : '';
  rows.push({ metric, base: `${base}%`, now: `${now}%`, delta: `${sign}${delta.toFixed(2)} pp`, status });
}

// ── Print table ──────────────────────────────────────────────────────────────
console.log('\n📊 Coverage Gate Check');
console.log(`   Threshold: −${THRESHOLD} pp below baseline\n`);
console.log('  Metric       │ Baseline │  Current │    Delta │ Status');
console.log('  ─────────────┼──────────┼──────────┼──────────┼────────');
for (const r of rows) {
  console.log(
    `  ${r.metric.padEnd(12)} │ ${r.base.padStart(8)} │ ${r.now.padStart(8)} │ ${r.delta.padStart(8)} │ ${r.status}`
  );
}
console.log('');

if (failed) {
  console.error(`❌ Coverage gate FAILED — one or more metrics dropped >${THRESHOLD} pp below baseline.`);
  console.error('   Fix by adding tests or update baseline with: node scripts/check-coverage.js --update-baseline');
  process.exit(1);
} else {
  console.log('✅ Coverage gate PASSED');
}

// ── Optional: --update-baseline ──────────────────────────────────────────────
if (process.argv.includes('--update-baseline')) {
  const newBaseline = {
    lines: current.lines.pct,
    statements: current.statements.pct,
    functions: current.functions.pct,
    branches: current.branches.pct,
    _updated: new Date().toISOString().slice(0, 10),
    _note: baseline._note || 'CI coverage baseline.',
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2) + '\n');
  console.log('📝 Baseline updated:', BASELINE_PATH);
}
