#!/usr/bin/env node
/*
 * check-unused-endpoints.mjs — Kiểm tra nhanh các endpoint từ BE chưa được sử dụng ở FE.
 *
 * Cách dùng:
 *   node scripts/check-unused-endpoints.mjs
 *   npm run check:endpoints
 *   npm run check:endpoints -- --all
 *   npm run check:endpoints -- --json
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const API_DOCS_DIR = join(DOCS_DIR, 'api');
const CATALOG_JSON = join(DOCS_DIR, 'api-catalog.json');
const SRC_DIR = join(ROOT, 'src');
const ENDPOINTS_TS = join(SRC_DIR, 'common', 'constants', 'api-endpoints.ts');

const args = process.argv.slice(2);
const showAll = args.includes('--all');
const outputJson = args.includes('--json');

// Màu sắc ANSI cho console
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// 1. Tải danh sách endpoints từ api-catalog.json hoặc docs/api/*.md
let endpoints = [];

if (existsSync(CATALOG_JSON)) {
  try {
    const catalog = JSON.parse(readFileSync(CATALOG_JSON, 'utf8'));
    endpoints = (catalog.operations || []).map((op) => ({
      group: op.group,
      method: op.method.toUpperCase(),
      path: op.path,
      summary: op.summary || '',
      operationId: op.operationId || '',
    }));
  } catch (err) {
    console.error(`${c.red}Lỗi đọc file ${CATALOG_JSON}: ${err.message}${c.reset}`);
  }
}

if (endpoints.length === 0 && existsSync(API_DOCS_DIR)) {
  const files = readdirSync(API_DOCS_DIR).filter((f) => f.endsWith('.md'));
  files.forEach((file) => {
    const groupName = file.replace('.md', '');
    const content = readFileSync(join(API_DOCS_DIR, file), 'utf8');
    const lines = content.split('\n');
    let current = null;

    lines.forEach((line) => {
      const match = line.match(/^##\s+(GET|POST|PUT|PATCH|DELETE)\s+`([^`]+)`/i);
      if (match) {
        if (current) endpoints.push(current);
        current = {
          group: groupName,
          method: match[1].toUpperCase(),
          path: match[2],
          summary: '',
          operationId: '',
        };
        return;
      }
      if (current) {
        const opMatch = line.match(/^-\s+operationId:\s+`([^`]+)`/);
        if (opMatch) {
          current.operationId = opMatch[1];
        } else if (!current.summary && line.trim() && !line.startsWith('#') && !line.startsWith('-')) {
          current.summary = line.trim();
        }
      }
    });
    if (current) endpoints.push(current);
  });
}

if (endpoints.length === 0) {
  console.error(`${c.red}✖ Không tìm thấy endpoint nào trong docs/api hoặc docs/api-catalog.json!${c.reset}`);
  console.error(`  Hãy chạy trước: ${c.cyan}npm run sync:swagger${c.reset}`);
  process.exit(1);
}

// 2. Phân tích API_ENDPOINTS từ api-endpoints.ts
let API_ENDPOINTS = {};
if (existsSync(ENDPOINTS_TS)) {
  try {
    const code = readFileSync(ENDPOINTS_TS, 'utf8')
      .replace(/: string/g, '')
      .replace(/as const;/g, ';')
      .replace(/export const API_ENDPOINTS =/, 'API_ENDPOINTS =');
    const fn = new Function(code + '\nreturn API_ENDPOINTS;');
    API_ENDPOINTS = fn();
  } catch (err) {
    console.warn(`${c.yellow}Cảnh báo: Không thể parse động api-endpoints.ts (${err.message})${c.reset}`);
  }
}

const constantMap = [];
function walkObj(obj, prefix = 'API_ENDPOINTS') {
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = `${prefix}.${key}`;
    if (typeof val === 'string') {
      constantMap.push({ keyPath: currentPath, template: val, type: 'string' });
    } else if (typeof val === 'function') {
      const rendered = val('__PARAM1__', '__PARAM2__');
      constantMap.push({ keyPath: currentPath, template: rendered, type: 'function', fn: val });
    } else if (typeof val === 'object' && val !== null) {
      walkObj(val, currentPath);
    }
  }
}
walkObj(API_ENDPOINTS);

function matchConstant(docEp, entry) {
  const stripped = docEp.path.replace(/^\/api\/v1/, '');
  if (entry.type === 'string') {
    return stripped === entry.template;
  }
  return (
    entry.template.replace(/__PARAM[0-9]+__/g, '{param}') ===
    stripped.replace(/\{[^}]+\}/g, '{param}')
  );
}

// 3. Quét toàn bộ file trong src/
function getAllFiles(dir, filter = () => true) {
  let res = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        res = res.concat(getAllFiles(full, filter));
      } else if (entry.isFile() && filter(full)) {
        res.push(full);
      }
    }
  } catch {}
  return res;
}

const allTsFiles = getAllFiles(SRC_DIR, (p) => /\.(ts|tsx)$/.test(p));
const fileContents = allTsFiles.map((p) => ({
  path: p,
  relPath: relative(ROOT, p).replace(/\\/g, '/'),
  content: readFileSync(p, 'utf8'),
}));

// 4. Kiểm tra từng endpoint end-to-end (API -> Query/Hook -> UI/Page)
const results = endpoints.map((ep) => {
  const strippedPath = ep.path.replace(/^\/api\/v1/, '');
  const matchedConstants = constantMap.filter((c) => matchConstant(ep, c));

  // A. Tìm file API layer trực tiếp gọi endpoint này
  const apiLayerFiles = [];
  const apiFunctions = [];

  for (const f of fileContents) {
    if (f.relPath.includes('api-endpoints.ts') || f.relPath.includes('.spec.') || f.relPath.includes('.test.')) continue;

    const isApiFile = f.relPath.includes('/api/') || f.relPath.endsWith('.api.ts');
    if (!isApiFile) continue;

    let matchedInFile = false;
    // Kiểm tra constant
    for (const c of matchedConstants) {
      const shortKey = c.keyPath.replace(/^API_ENDPOINTS\./, '');
      if (f.content.includes(c.keyPath) || f.content.includes(shortKey)) {
        matchedInFile = true;
      }
    }
    // Kiểm tra raw string
    if (f.content.includes(`'${strippedPath}'`) || f.content.includes(`"${strippedPath}"`)) {
      matchedInFile = true;
    }
    // Route handler Next.js
    if (f.relPath.startsWith('src/app/api/')) {
      const routePath = f.relPath.replace(/^src\/app\/api/, '').replace(/\/route\.ts$/, '');
      if (routePath === strippedPath || routePath === strippedPath.replace(/^\/auth/, '')) {
        matchedInFile = true;
      }
    }

    if (matchedInFile) {
      apiLayerFiles.push(f.relPath);

      // Tìm tên các hàm bao quanh trong file API
      const lines = f.content.split('\n');
      lines.forEach((line, lineIdx) => {
        const hasMatch = matchedConstants.some(c => line.includes(c.keyPath) || line.includes(c.keyPath.replace(/^API_ENDPOINTS\./, ''))) ||
                         line.includes(`'${strippedPath}'`) || line.includes(`"${strippedPath}"`);
        if (hasMatch) {
          for (let i = lineIdx; i >= Math.max(0, lineIdx - 15); i--) {
            const fnMatch = lines[i].match(/([a-zA-Z0-9_]+)\s*[:=]\s*(?:async\s*)?\(/) ||
                            lines[i].match(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/) ||
                            lines[i].match(/export\s+const\s+([a-zA-Z0-9_]+)/);
            if (fnMatch && fnMatch[1] !== 'const' && fnMatch[1] !== 'async') {
              apiFunctions.push(fnMatch[1]);
              break;
            }
          }
        }
      });
    }
  }

  // B. Trace caller của các hàm API đó trong Query hooks
  const uniqueApiFuncs = [...new Set(apiFunctions)];
  const queryFiles = [];
  const queryHooks = [];

  for (const f of fileContents) {
    if (f.relPath.includes('.spec.') || f.relPath.includes('.test.')) continue;
    const isQueryFile = f.relPath.includes('/queries/') || f.relPath.includes('/hooks/');
    if (!isQueryFile) continue;

    for (const fnName of uniqueApiFuncs) {
      if (f.content.includes(fnName)) {
        queryFiles.push(f.relPath);

        // Tìm tên hook `use...`
        const qLines = f.content.split('\n');
        qLines.forEach((line, idx) => {
          if (line.includes(fnName)) {
            for (let i = idx; i >= Math.max(0, idx - 10); i--) {
              const hookMatch = qLines[i].match(/export\s+const\s+(use[a-zA-Z0-9_]+)/) ||
                                qLines[i].match(/export\s+function\s+(use[a-zA-Z0-9_]+)/);
              if (hookMatch) {
                queryHooks.push(hookMatch[1]);
                break;
              }
            }
          }
        });
      }
    }
  }

  // C. Trace caller trong UI (components hoặc app pages)
  const uniqueQueryHooks = [...new Set(queryHooks)];
  const uiFiles = [];

  // Ngoại lệ Next.js Auth proxy
  if (ep.path === '/api/v1/auth/login' || ep.path === '/api/v1/auth/register') {
    uiFiles.push('src/features/auth/components/login-form.tsx / register-form.tsx');
  }

  for (const f of fileContents) {
    if (f.relPath.includes('.spec.') || f.relPath.includes('.test.')) continue;
    const isUi = f.relPath.includes('/components/') || (f.relPath.includes('/app/') && !f.relPath.includes('/app/api/'));
    if (!isUi) continue;

    // Kiểm tra gọi query hook
    for (const hook of uniqueQueryHooks) {
      if (f.content.includes(hook)) {
        uiFiles.push(f.relPath);
      }
    }
    // Hoặc kiểm tra gọi trực tiếp hàm API
    for (const fnName of uniqueApiFuncs) {
      if (f.content.includes(fnName)) {
        uiFiles.push(f.relPath);
      }
    }
  }

  const uniqueApiFiles = [...new Set(apiLayerFiles)];
  const uniqueQueryFiles = [...new Set(queryFiles)];
  const uniqueUiFiles = [...new Set(uiFiles)];

  // Xác định trạng thái
  let status = 'UNUSED'; // Chưa có hàm API
  if (uniqueApiFiles.length > 0) {
    if (uniqueUiFiles.length > 0) {
      status = 'FULL'; // Đã có API & đã được gọi từ UI
    } else {
      status = 'API_ONLY'; // Đã viết API/Query nhưng chưa gắn vào UI nào
    }
  }

  return {
    ...ep,
    strippedPath,
    constants: matchedConstants.map((c) => c.keyPath),
    status,
    apiLayerFiles: uniqueApiFiles,
    queryFiles: uniqueQueryFiles,
    uiFiles: uniqueUiFiles,
  };
});

if (outputJson) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

const unusedList = results.filter((r) => r.status === 'UNUSED');
const apiOnlyList = results.filter((r) => r.status === 'API_ONLY');
const fullList = results.filter((r) => r.status === 'FULL');

console.log(`\n${c.bold}================================================================${c.reset}`);
console.log(`${c.bold}   🔍 BÁO CÁO KIỂM TRA ENDPOINT BACKEND TRÊN FRONTEND${c.reset}`);
console.log(`${c.bold}================================================================${c.reset}\n`);

console.log(`📌 ${c.bold}Tổng số endpoint từ BE:${c.reset} ${c.cyan}${results.length}${c.reset}`);
console.log(`✅ ${c.bold}Đã tích hợp đầy đủ và gắn UI:${c.reset} ${c.green}${fullList.length}${c.reset} (${((fullList.length / results.length) * 100).toFixed(1)}%)`);
console.log(`⚠️  ${c.bold}Đã viết API nhưng chưa gắn UI:${c.reset} ${c.yellow}${apiOnlyList.length}${c.reset}`);
console.log(`❌ ${c.bold}Chưa triển khai trong API Layer:${c.reset} ${c.red}${unusedList.length}${c.reset}`);
console.log('');

if (unusedList.length > 0) {
  console.log(`${c.bold}${c.red}❌ 1. CÁC ENDPOINT CHƯA ĐƯỢC TRIỂN KHAI TRONG FE (${unusedList.length}):${c.reset}`);
  unusedList.forEach((ep, i) => {
    console.log(`   ${c.red}${i + 1}. [${ep.group}] ${ep.method} ${ep.path}${c.reset}`);
    console.log(`      ${c.gray}Mô tả: ${ep.summary || 'Không có mô tả'}${c.reset}`);
    if (ep.constants.length > 0) {
      console.log(`      ${c.dim}Constant có sẵn: ${ep.constants.join(', ')}${c.reset}`);
    } else {
      console.log(`      ${c.yellow}Chưa có trong api-endpoints.ts!${c.reset}`);
    }
  });
  console.log('');
}

if (apiOnlyList.length > 0) {
  console.log(`${c.bold}${c.yellow}⚠️  2. CÁC ENDPOINT ĐÃ CÓ API/QUERY NHƯNG CHƯA ĐƯỢC GỌI TỪ UI (${apiOnlyList.length}):${c.reset}`);
  apiOnlyList.forEach((ep, i) => {
    console.log(`   ${c.yellow}${i + 1}. [${ep.group}] ${ep.method} ${ep.path}${c.reset}`);
    console.log(`      ${c.gray}Mô tả: ${ep.summary || 'Không có mô tả'}${c.reset}`);
    console.log(`      ${c.dim}API file: ${ep.apiLayerFiles.join(', ')}${c.reset}`);
    if (ep.queryFiles.length > 0) {
      console.log(`      ${c.dim}Query/Hook: ${ep.queryFiles.join(', ')}${c.reset}`);
    }
  });
  console.log('');
}

if (showAll && fullList.length > 0) {
  console.log(`${c.bold}${c.green}✅ 3. CÁC ENDPOINT ĐÃ HOẠT ĐỘNG ĐẦY ĐỦ (${fullList.length}):${c.reset}`);
  fullList.forEach((ep, i) => {
    console.log(`   ${c.green}${i + 1}. [${ep.group}] ${ep.method} ${ep.path}${c.reset} (${ep.summary})`);
  });
  console.log('');
}

if (!showAll) {
  console.log(`${c.gray}Tip: Dùng ${c.cyan}npm run check:endpoints -- --all${c.gray} để xem toàn bộ danh sách đầy đủ.${c.reset}`);
  console.log(`${c.gray}Tip: Dùng ${c.cyan}npm run check:endpoints -- --json${c.gray} để xuất dữ liệu định dạng JSON.${c.reset}\n`);
}
