#!/usr/bin/env node
/**
 * Xuất danh sách unit test ra file PDF.
 *
 * Cách dùng (chạy trong thư mục apps/api):
 *   npm run test:report
 *   node test/export-test-report.mjs --out "../../docs/Report 5/Report5_Unit_Test_Backend.pdf"
 *   node test/export-test-report.mjs "../../docs/Report 5/Report5_Unit_Test_Backend.pdf"
 *
 * Tùy chọn:
 *   --out <path>       Đường dẫn file PDF đầu ra (mặc định: test/reports/unit-test-report.pdf)
 *   --html <path>      Đường dẫn file HTML trung gian (mặc định: cùng thư mục với file PDF)
 *   --results <path>   Dùng lại file JSON kết quả Jest có sẵn (bỏ qua bước chạy test)
 *   --no-run           Không chạy Jest, chỉ xuất danh sách test (cột kết quả để trống)
 *
 * Script không dùng thêm thư viện ngoài: nó đọc các file *.unit-spec.ts, chạy Jest
 * để lấy trạng thái Passed/Failed, render HTML rồi dùng Edge/Chrome headless in ra PDF.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(testDir, '..');

function parseArgs(argv) {
  const options = {
    out: null,
    html: null,
    results: null,
    run: true,
  };
  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const [name, inlineValue] = arg.split('=');
    const readValue = () => {
      if (inlineValue !== undefined) return inlineValue;
      i += 1;
      return argv[i];
    };

    if (name === '--out') options.out = resolve(process.cwd(), readValue());
    else if (name === '--html') options.html = resolve(process.cwd(), readValue());
    else if (name === '--results') {
      options.results = resolve(process.cwd(), readValue());
      options.run = false;
    } else if (name === '--no-run') options.run = false;
    else if (name === '--help' || name === '-h') {
      console.log(
        'Dùng: node test/export-test-report.mjs [--out <pdf>] [--html <html>] [--results <json>] [--no-run]',
      );
      process.exit(0);
    } else if (!name.startsWith('-')) {
      positionals.push(arg);
    }
  }

  // Hỗ trợ truyền vị trí: node script.mjs <pdf> [html]
  if (!options.out && positionals[0]) {
    options.out = resolve(process.cwd(), positionals[0]);
  }
  if (!options.html && positionals[1]) {
    options.html = resolve(process.cwd(), positionals[1]);
  }

  options.out = options.out ?? join(testDir, 'reports', 'unit-test-report.pdf');
  if (!options.html) {
    options.html = options.out.replace(/\.pdf$/i, '') + '.html';
  }
  return options;
}

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'reports') continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) entries.push(...walk(full));
    else if (name.endsWith('.unit-spec.ts')) entries.push(full);
  }
  return entries;
}

function collectTests() {
  const files = walk(testDir).sort();
  const tests = [];
  let index = 0;

  for (const file of files) {
    const rel = relative(testDir, file).split(sep).join('/');
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    let lastDescribe = '';
    let currentUf = '—';
    let pendingComment = '';

    for (const line of lines) {
      const describeMatch = /^\s*describe\(\s*(['"`])(.*?)\1/.exec(line);
      if (describeMatch) {
        lastDescribe = describeMatch[2];
        const uf = /UF-(\d+)/.exec(lastDescribe);
        if (uf) currentUf = `UF-${uf[1]}`;
        pendingComment = '';
        continue;
      }

      const commentMatch = /^\s*\/\/\s?(.*)$/.exec(line);
      if (commentMatch) {
        pendingComment = commentMatch[1].trim();
        continue;
      }

      const testMatch = /^\s*it\(\s*(['"`])(.*?)\1/.exec(line);
      if (!testMatch) continue;

      const title = testMatch[2];
      const uf = /UF-(\d+)/.exec(pendingComment);
      if (uf) currentUf = `UF-${uf[1]}`;

      index += 1;
      tests.push({
        index,
        file: rel,
        describe: lastDescribe,
        uf: currentUf,
        title,
        description: pendingComment,
      });
      pendingComment = '';
    }
  }

  return tests;
}

function loadJestResults(tests, resultsPath = null) {
  let rawJson;
  if (resultsPath) {
    console.log(`Đọc kết quả Jest từ: ${resultsPath}`);
    rawJson = readFileSync(resultsPath, 'utf8');
  } else {
    const args = [
      '--config',
      join(testDir, 'jest-unit.json'),
      '--runInBand',
      '--json',
    ];

    const jestBin = join(apiDir, 'node_modules', 'jest', 'bin', 'jest.js');
    const useLocalJest = existsSync(jestBin);
    const command = useLocalJest
      ? process.execPath
      : process.platform === 'win32'
        ? 'npx.cmd'
        : 'npx';
    const commandArgs = useLocalJest ? [jestBin, ...args] : ['jest', ...args];

    console.log('Đang chạy Jest để lấy kết quả...');
    const run = spawnSync(command, commandArgs, {
      cwd: apiDir,
      encoding: 'utf8',
      timeout: 10 * 60 * 1000,
      shell: !useLocalJest,
    });

    if (!run.stdout) {
      throw new Error(`Không chạy được Jest: ${run.error?.message ?? ''}`);
    }
    rawJson = run.stdout;
  }

  const parsed = JSON.parse(rawJson);
  const byFileAndTitle = new Map();

  for (const suite of parsed.testResults ?? []) {
    const suiteName = basename(suite.name ?? '');
    for (const assertion of suite.assertionResults ?? []) {
      const key = `${suiteName}::${assertion.title}`;
      const queue = byFileAndTitle.get(key) ?? [];
      queue.push({
        status: assertion.status,
        duration: assertion.duration ?? 0,
      });
      byFileAndTitle.set(key, queue);
    }
  }

  for (const test of tests) {
    const key = `${basename(test.file)}::${test.title}`;
    const queue = byFileAndTitle.get(key) ?? [];
    const result = queue.shift();
    test.status = result?.status ?? 'unknown';
    test.duration = result?.duration ?? 0;
  }

  return {
    total: parsed.numTotalTests ?? tests.length,
    passed: parsed.numPassedTests ?? 0,
    failed: parsed.numFailedTests ?? 0,
    pending: parsed.numPendingTests ?? 0,
    suites: parsed.numTotalTestSuites ?? 0,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const STATUS_LABEL = {
  passed: 'Passed',
  failed: 'Failed',
  pending: 'Pending',
  todo: 'Todo',
  disabled: 'Disabled',
  unknown: '—',
};

function renderHtml(tests, summary) {
  const groups = new Map();
  for (const test of tests) {
    const key = test.uf;
    const group = groups.get(key) ?? {
      uf: key,
      name: test.describe || test.file,
      total: 0,
      passed: 0,
      failed: 0,
    };
    group.total += 1;
    if (test.status === 'passed') group.passed += 1;
    if (test.status === 'failed') group.failed += 1;
    groups.set(key, group);
  }

  const today = new Date().toLocaleDateString('vi-VN');
  const totalFail = summary?.failed ?? tests.filter((t) => t.status === 'failed').length;
  const totalPass = summary?.passed ?? tests.filter((t) => t.status === 'passed').length;

  const summaryRows = [...groups.values()]
    .sort((a, b) => a.uf.localeCompare(b.uf, 'vi', { numeric: true }))
    .map(
      (g) => `
        <tr>
          <td class="center">${escapeHtml(g.uf)}</td>
          <td>${escapeHtml(g.name)}</td>
          <td class="center">${g.total}</td>
          <td class="center pass">${g.passed}</td>
          <td class="center ${g.failed ? 'fail' : ''}">${g.failed}</td>
        </tr>`,
    )
    .join('');

  const detailRows = tests
    .map((test) => {
      const status = test.status ?? 'unknown';
      const label = STATUS_LABEL[status] ?? status;
      return `
        <tr>
          <td class="center">${test.index}</td>
          <td class="center nowrap">${escapeHtml(test.uf)}</td>
          <td>${escapeHtml(test.describe || test.file)}<div class="file">${escapeHtml(test.file)}</div></td>
          <td class="test-title">${escapeHtml(test.title)}</td>
          <td>${escapeHtml(test.description)}</td>
          <td class="center nowrap ${status === 'passed' ? 'pass' : status === 'failed' ? 'fail' : ''}">${escapeHtml(label)}</td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Báo cáo Unit Test Backend - Frevia</title>
<style>
  @page { size: A4; margin: 13mm 11mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    color: #0f172a;
    font-size: 9.5px;
    line-height: 1.38;
  }
  h1 { margin: 0 0 4px; font-size: 22px; color: #1e3a8a; letter-spacing: .3px; }
  h2 { margin: 18px 0 7px; font-size: 13px; color: #1e3a8a; border-left: 4px solid #2563eb; padding-left: 8px; }
  .subtitle { color: #475569; font-size: 10.5px; }
  .meta { margin: 10px 0 14px; padding: 10px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; }
  .meta span { display: inline-block; margin-right: 18px; }
  .cards { display: flex; gap: 8px; margin: 10px 0 4px; }
  .card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
  .card .value { font-size: 18px; font-weight: 700; color: #1e3a8a; }
  .card .label { font-size: 8.5px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th {
    background: #1e3a8a;
    color: #fff;
    text-align: left;
    font-size: 8.5px;
    padding: 5px 5px;
    border: 1px solid #1e3a8a;
  }
  td { padding: 4px 5px; border: 1px solid #dbe3ef; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tr { page-break-inside: avoid; }
  .center { text-align: center; }
  .nowrap { white-space: nowrap; }
  .pass { color: #15803d; font-weight: 600; }
  .fail { color: #b91c1c; font-weight: 600; }
  .detail td:nth-child(1) { width: 26px; }
  .detail td:nth-child(2) { width: 48px; }
  .detail td:nth-child(3) { width: 150px; }
  .detail td:nth-child(4) { width: 200px; }
  .detail td:nth-child(6) { width: 58px; }
  .test-title { font-weight: 600; color: #0f172a; }
  .file { color: #64748b; font-size: 7.5px; margin-top: 1px; }
  .footer { margin-top: 14px; padding-top: 6px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 8px; }
  .group-title { page-break-before: auto; }
</style>
</head>
<body>
  <h1>BÁO CÁO UNIT TEST BACKEND — FREVIA</h1>
  <div class="subtitle">Danh sách kiểm thử đơn vị theo ma trận UF-01 → UF-84 (Report 5 - Unit Test)</div>

  <div class="meta">
    <span><b>Ngày xuất:</b> ${escapeHtml(today)}</span>
    <span><b>Thư mục test:</b> apps/api/test</span>
    <span><b>Lệnh chạy:</b> npm run test:unit</span>
  </div>

  <div class="cards">
    <div class="card"><div class="value">${summary?.suites ?? '—'}</div><div class="label">Test suites</div></div>
    <div class="card"><div class="value">${summary?.total ?? tests.length}</div><div class="label">Tổng test case</div></div>
    <div class="card"><div class="value pass">${totalPass}</div><div class="label">Passed</div></div>
    <div class="card"><div class="value fail">${totalFail}</div><div class="label">Failed</div></div>
  </div>

  <h2>Tổng hợp theo chức năng</h2>
  <table class="summary">
    <thead>
      <tr><th class="center">Mã UF</th><th>Nhóm chức năng</th><th class="center">Số test</th><th class="center">Passed</th><th class="center">Failed</th></tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Danh sách chi tiết test case</h2>
  <table class="detail">
    <thead>
      <tr>
        <th class="center">STT</th>
        <th class="center">UF</th>
        <th>Nhóm / File</th>
        <th>Tên test (Jest)</th>
        <th>Mô tả (comment trong code)</th>
        <th class="center">Kết quả</th>
      </tr>
    </thead>
    <tbody>${detailRows}</tbody>
  </table>

  <div class="footer">
    File được tạo tự động bởi <b>apps/api/test/export-test-report.mjs</b>. Nội dung cột “Mô tả” lấy từ comment
    <b>//</b> ngay trên mỗi test trong các file <b>*.unit-spec.ts</b>.
  </div>
</body>
</html>`;
}

function findBrowser() {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/microsoft-edge',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function exportPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  if (!browser) {
    throw new Error(
      'Không tìm thấy Microsoft Edge hoặc Google Chrome để in PDF. Hãy cài một trong hai trình duyệt này, hoặc mở file HTML và in thủ công.',
    );
  }

  const profileDir = join(tmpdir(), `frevia-test-report-${process.pid}`);
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-pdf-header-footer',
    `--user-data-dir=${profileDir}`,
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ];

  console.log(`Đang in PDF bằng ${basename(browser)}...`);
  const result = spawnSync(browser, args, {
    encoding: 'utf8',
    timeout: 2 * 60 * 1000,
    windowsHide: true,
  });

  rmSync(profileDir, { recursive: true, force: true });

  if (result.error) {
    throw new Error(`Không in được PDF: ${result.error.message}`);
  }
  if (!existsSync(pdfPath) || statSync(pdfPath).size === 0) {
    throw new Error(
      `Trình duyệt không tạo được PDF.${result.stderr ? `\n${result.stderr}` : ''}`,
    );
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const tests = collectTests();

  if (tests.length === 0) {
    throw new Error('Không tìm thấy test nào trong các file *.unit-spec.ts.');
  }

  const summary =
    options.run || options.results
      ? loadJestResults(tests, options.results)
      : null;

  mkdirSync(dirname(options.out), { recursive: true });
  mkdirSync(dirname(options.html), { recursive: true });

  writeFileSync(options.html, renderHtml(tests, summary), 'utf8');
  console.log(`Đã tạo HTML: ${options.html}`);

  exportPdf(options.html, options.out);

  const sizeKb = (statSync(options.out).size / 1024).toFixed(1);
  console.log(`Đã tạo PDF: ${options.out} (${sizeKb} KB)`);
  console.log(`Tổng số test case: ${tests.length}`);
  if (summary) {
    console.log(
      `Kết quả Jest: ${summary.passed} passed, ${summary.failed} failed, ${summary.total} total`,
    );
  }
}

main();
