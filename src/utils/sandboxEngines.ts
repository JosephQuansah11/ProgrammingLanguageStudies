import React from 'react';
import { transform } from 'sucrase';

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  text: string;
}

export interface JsExecResult {
  logs: ConsoleEntry[];
  error: string | null;
  elapsedMs: number;
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
    return String(arg);
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

export function runJavaScriptOrTs(code: string, isTypeScript: boolean): JsExecResult {
  const logs: ConsoleEntry[] = [];
  const start = performance.now();

  const customConsole = {
    log: (...args: unknown[]) => logs.push({ level: 'log', text: args.map(formatArg).join(' ') }),
    info: (...args: unknown[]) => logs.push({ level: 'info', text: args.map(formatArg).join(' ') }),
    warn: (...args: unknown[]) => logs.push({ level: 'warn', text: args.map(formatArg).join(' ') }),
    error: (...args: unknown[]) => logs.push({ level: 'error', text: args.map(formatArg).join(' ') }),
  };

  try {
    let runnableCode = code;
    if (isTypeScript) {
      const compiled = transform(code, { transforms: ['typescript'] });
      runnableCode = compiled.code;
    }

    const fn = new Function('console', `"use strict";\n${runnableCode}`);
    const ret = fn(customConsole);
    if (ret !== undefined) {
      logs.push({ level: 'info', text: `↳ Return value: ${formatArg(ret)}` });
    }
    return { logs, error: null, elapsedMs: Number((performance.now() - start).toFixed(2)) };
  } catch (err) {
    return {
      logs,
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
  }
}

export interface ReactCompileResult {
  Component: React.ComponentType | null;
  error: string | null;
  elapsedMs: number;
}

export function compileReactTsx(code: string): ReactCompileResult {
  const start = performance.now();
  try {
    const compiled = transform(code, {
      transforms: ['typescript', 'jsx', 'imports'],
      jsxRuntime: 'classic',
    });

    const exportsObj: { default?: React.ComponentType } = {};
    const moduleObj = { exports: exportsObj };

    const requireFn = (modName: string) => {
      if (modName === 'react') return React;
      throw new Error(`Module "${modName}" is not available in browser sandbox (React hooks are built-in).`);
    };

    const factory = new Function('require', 'module', 'exports', 'React', compiled.code);
    factory(requireFn, moduleObj, exportsObj, React);

    const Comp = moduleObj.exports.default ?? exportsObj.default;
    if (typeof Comp !== 'function') {
      return {
        Component: null,
        error: 'Export a default React component (e.g. export default function App() { ... }).',
        elapsedMs: Number((performance.now() - start).toFixed(2)),
      };
    }

    return {
      Component: Comp,
      error: null,
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
  } catch (err) {
    return {
      Component: null,
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
  }
}

// ============================================================================
// 2. IN-BROWSER STAR SCHEMA SQL ENGINE
// ============================================================================

export type SqlRow = Record<string, string | number>;

export const WAREHOUSE_TABLES: Record<string, SqlRow[]> = {
  fact_orders: [
    { order_id: 'ORD-1001', customer_id: 'C1', product_id: 'P1', order_date: '2026-01-12', quantity: 2, amount: 480, status: 'completed' },
    { order_id: 'ORD-1002', customer_id: 'C2', product_id: 'P2', order_date: '2026-01-18', quantity: 1, amount: 1200, status: 'completed' },
    { order_id: 'ORD-1003', customer_id: 'C3', product_id: 'P3', order_date: '2026-02-04', quantity: 3, amount: 270, status: 'refunded' },
    { order_id: 'ORD-1004', customer_id: 'C1', product_id: 'P4', order_date: '2026-02-19', quantity: 1, amount: 890, status: 'completed' },
    { order_id: 'ORD-1005', customer_id: 'C4', product_id: 'P2', order_date: '2026-03-08', quantity: 2, amount: 2400, status: 'completed' },
    { order_id: 'ORD-1006', customer_id: 'C5', product_id: 'P1', order_date: '2026-04-03', quantity: 1, amount: 240, status: 'completed' },
    { order_id: 'ORD-1007', customer_id: 'C2', product_id: 'P4', order_date: '2026-04-21', quantity: 2, amount: 1780, status: 'completed' },
    { order_id: 'ORD-1008', customer_id: 'C4', product_id: 'P3', order_date: '2026-05-11', quantity: 4, amount: 360, status: 'completed' },
    { order_id: 'ORD-1009', customer_id: 'C3', product_id: 'P1', order_date: '2026-05-27', quantity: 3, amount: 720, status: 'completed' },
    { order_id: 'ORD-1010', customer_id: 'C5', product_id: 'P2', order_date: '2026-06-09', quantity: 1, amount: 1200, status: 'cancelled' },
  ],
  dim_customers: [
    { customer_id: 'C1', customer_name: 'Acme Robotics', segment: 'Enterprise', country: 'Germany' },
    { customer_id: 'C2', customer_name: 'Northstar AI', segment: 'Enterprise', country: 'USA' },
    { customer_id: 'C3', customer_name: 'Solstice Retail', segment: 'SMB', country: 'UK' },
    { customer_id: 'C4', customer_name: 'Kestrel Labs', segment: 'Enterprise', country: 'USA' },
    { customer_id: 'C5', customer_name: 'Beacon Health', segment: 'Mid-Market', country: 'Canada' },
  ],
  dim_products: [
    { product_id: 'P1', product_name: 'Edge Sensor Kit', category: 'Hardware', unit_price: 240 },
    { product_id: 'P2', product_name: 'GPU Inference Node', category: 'Compute', unit_price: 1200 },
    { product_id: 'P3', product_name: 'Vision SDK Seat', category: 'Software', unit_price: 90 },
    { product_id: 'P4', product_name: 'Warehouse Sync Pro', category: 'Software', unit_price: 890 },
  ],
  dim_date: [
    { date_key: '2026-01-12', month: '2026-01', quarter: '2026-Q1' },
    { date_key: '2026-01-18', month: '2026-01', quarter: '2026-Q1' },
    { date_key: '2026-02-04', month: '2026-02', quarter: '2026-Q1' },
    { date_key: '2026-02-19', month: '2026-02', quarter: '2026-Q1' },
    { date_key: '2026-03-08', month: '2026-03', quarter: '2026-Q1' },
    { date_key: '2026-04-03', month: '2026-04', quarter: '2026-Q2' },
    { date_key: '2026-04-21', month: '2026-04', quarter: '2026-Q2' },
    { date_key: '2026-05-11', month: '2026-05', quarter: '2026-Q2' },
    { date_key: '2026-05-27', month: '2026-05', quarter: '2026-Q2' },
    { date_key: '2026-06-09', month: '2026-06', quarter: '2026-Q2' },
  ],
};

export interface SqlResult {
  columns: string[];
  rows: SqlRow[];
  elapsedMs: number;
  error: string | null;
}

function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if ((ch === "'" || ch === '"') && str[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
    }
    if (!inQuote) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function resolveField(row: SqlRow, expr: string): string | number | undefined {
  const clean = expr.trim();
  if (clean in row) return row[clean];
  const noPrefix = clean.includes('.') ? clean.split('.').slice(1).join('.') : clean;
  if (noPrefix in row) return row[noPrefix];
  return undefined;
}

function parseLiteral(raw: string): string | number {
  const t = raw.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

function evalCondition(row: SqlRow, clause: string): boolean {
  const orParts = clause.split(/\s+OR\s+/i);
  return orParts.some((orPart) => {
    const andParts = orPart.split(/\s+AND\s+/i);
    return andParts.every((cond) => {
      const c = cond.trim();
      const inMatch = c.match(/^([a-zA-Z0-9_.]+)\s+IN\s*\((.+)\)$/i);
      if (inMatch) {
        const val = resolveField(row, inMatch[1]);
        const items = splitTopLevelCommas(inMatch[2]).map(parseLiteral);
        return val !== undefined && items.includes(val);
      }
      const likeMatch = c.match(/^([a-zA-Z0-9_.]+)\s+LIKE\s+['"](.+)['"]$/i);
      if (likeMatch) {
        const val = String(resolveField(row, likeMatch[1]) ?? '');
        const regex = new RegExp('^' + likeMatch[2].replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        return regex.test(val);
      }
      const opMatch = c.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
      if (!opMatch) return true;
      const lhs = resolveField(row, opMatch[1]);
      const rhs = parseLiteral(opMatch[3]);
      if (lhs === undefined) return false;
      switch (opMatch[2]) {
        case '=':
          return lhs == rhs;
        case '!=':
        case '<>':
          return lhs != rhs;
        case '>':
          return Number(lhs) > Number(rhs);
        case '<':
          return Number(lhs) < Number(rhs);
        case '>=':
          return Number(lhs) >= Number(rhs);
        case '<=':
          return Number(lhs) <= Number(rhs);
        default:
          return false;
      }
    });
  });
}

export function runSqlQuery(rawSql: string): SqlResult {
  const start = performance.now();
  try {
    const cleaned = rawSql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join(' ')
      .replace(/;\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return { columns: [], rows: [], elapsedMs: 0, error: 'Enter a SELECT query to run.' };
    }

    const match = cleaned.match(
      /^SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?(.*)$/i
    );
    if (!match) {
      return {
        columns: [],
        rows: [],
        elapsedMs: 0,
        error: 'Only SELECT ... FROM ... queries are supported in this analytics warehouse.',
      };
    }

    const isDistinct = Boolean(match[1]);
    const selectListRaw = match[2].trim();
    const baseTableName = match[3].trim();
    const baseAlias = (match[4] && !/^(WHERE|JOIN|INNER|LEFT|GROUP|ORDER|LIMIT)$/i.test(match[4])
      ? match[4]
      : baseTableName);

    // Handle case where match[4] accidentally captured a keyword if no alias was present
    let rest = match[5] ?? '';
    if (match[4] && /^(WHERE|JOIN|INNER|LEFT|GROUP|ORDER|LIMIT)$/i.test(match[4])) {
      rest = `${match[4]} ${rest}`.trim();
    }

    const baseTable = WAREHOUSE_TABLES[baseTableName];
    if (!baseTable) {
      return {
        columns: [],
        rows: [],
        elapsedMs: 0,
        error: `Unknown table "${baseTableName}". Available: ${Object.keys(WAREHOUSE_TABLES).join(', ')}.`,
      };
    }

    // Build initial aliased rows
    let workingRows: SqlRow[] = baseTable.map((r) => {
      const out: SqlRow = {};
      for (const [k, v] of Object.entries(r)) {
        out[`${baseAlias}.${k}`] = v;
        if (!(k in out)) out[k] = v;
      }
      return out;
    });

    // Extract JOINs
    const joinRegex = /^(?:(INNER|LEFT)\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)\s*(.*)$/i;
    let remaining = rest.trim();
    while (/^(?:INNER\s+|LEFT\s+)?JOIN\s+/i.test(remaining)) {
      const jm = remaining.match(joinRegex);
      if (!jm) {
        return { columns: [], rows: [], elapsedMs: 0, error: `Invalid JOIN syntax near: ${remaining}` };
      }
      const joinType = (jm[1] ?? 'INNER').toUpperCase();
      const jTableName = jm[2];
      const jAlias = jm[3] && !/^ON$/i.test(jm[3]) ? jm[3] : jTableName;
      const onLeft = jm[4];
      const onRight = jm[5];
      remaining = jm[6].trim();

      const jTable = WAREHOUSE_TABLES[jTableName];
      if (!jTable) {
        return { columns: [], rows: [], elapsedMs: 0, error: `Unknown joined table "${jTableName}".` };
      }

      const nextRows: SqlRow[] = [];
      for (const leftRow of workingRows) {
        let matchedAny = false;
        for (const rightRaw of jTable) {
          const rightPrefixed: SqlRow = {};
          for (const [k, v] of Object.entries(rightRaw)) {
            rightPrefixed[`${jAlias}.${k}`] = v;
          }
          const combined: SqlRow = { ...leftRow, ...rightPrefixed };
          for (const [k, v] of Object.entries(rightRaw)) {
            if (!(k in combined)) combined[k] = v;
          }
          const lv = resolveField(combined, onLeft);
          const rv = resolveField(combined, onRight);
          if (lv !== undefined && rv !== undefined && lv == rv) {
            nextRows.push(combined);
            matchedAny = true;
          }
        }
        if (!matchedAny && joinType === 'LEFT') {
          nextRows.push(leftRow);
        }
      }
      workingRows = nextRows;
    }

    // Extract WHERE, GROUP BY, ORDER BY, LIMIT
    let whereClause = '';
    let groupByClause = '';
    let orderByClause = '';
    let limitNum: number | null = null;

    const limitMatch = remaining.match(/\s*LIMIT\s+(\d+)\s*$/i);
    if (limitMatch) {
      limitNum = parseInt(limitMatch[1], 10);
      remaining = remaining.slice(0, limitMatch.index).trim();
    }

    const orderMatch = remaining.match(/\s*ORDER\s+BY\s+(.+)$/i);
    if (orderMatch) {
      orderByClause = orderMatch[1].trim();
      remaining = remaining.slice(0, orderMatch.index).trim();
    }

    const groupMatch = remaining.match(/\s*GROUP\s+BY\s+(.+)$/i);
    if (groupMatch) {
      groupByClause = groupMatch[1].trim();
      remaining = remaining.slice(0, groupMatch.index).trim();
    }

    const whereMatch = remaining.match(/^WHERE\s+(.+)$/i);
    if (whereMatch) {
      whereClause = whereMatch[1].trim();
    }

    if (whereClause) {
      workingRows = workingRows.filter((row) => evalCondition(row, whereClause));
    }

    // Parse SELECT expressions
    const selectItems =
      selectListRaw === '*'
        ? []
        : splitTopLevelCommas(selectListRaw).map((expr) => {
            const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
            const rawExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
            const colName = aliasMatch
              ? aliasMatch[2].trim()
              : rawExpr.includes('.')
              ? rawExpr.split('.').pop()!
              : rawExpr;
            return { rawExpr, colName };
          });

    const hasAggregate = selectItems.some((s) =>
      /^(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(s.rawExpr)
    );

    let outputRows: SqlRow[] = [];

    if (groupByClause || hasAggregate) {
      const groupKeys = groupByClause ? splitTopLevelCommas(groupByClause) : [];
      const buckets = new Map<string, SqlRow[]>();

      for (const row of workingRows) {
        const keyVal = groupKeys.map((gk) => String(resolveField(row, gk) ?? 'NULL')).join('||');
        const list = buckets.get(keyVal) ?? [];
        list.push(row);
        buckets.set(keyVal, list);
      }

      if (workingRows.length === 0 && !groupByClause) {
        buckets.set('__all__', []);
      }

      for (const [, groupRows] of buckets.entries()) {
        const outRow: SqlRow = {};
        for (const item of selectItems) {
          const aggMatch = item.rawExpr.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(.+?)\s*\)$/i);
          if (aggMatch) {
            const fn = aggMatch[1].toUpperCase();
            const target = aggMatch[2].trim();
            if (fn === 'COUNT') {
              outRow[item.colName] =
                target === '*'
                  ? groupRows.length
                  : groupRows.filter((r) => resolveField(r, target) !== undefined).length;
            } else {
              const nums = groupRows
                .map((r) => Number(resolveField(r, target)))
                .filter((n) => !Number.isNaN(n));
              if (nums.length === 0) {
                outRow[item.colName] = 0;
              } else if (fn === 'SUM') {
                outRow[item.colName] = Number(nums.reduce((a, b) => a + b, 0).toFixed(2));
              } else if (fn === 'AVG') {
                outRow[item.colName] = Number(
                  (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
                );
              } else if (fn === 'MIN') {
                outRow[item.colName] = Math.min(...nums);
              } else if (fn === 'MAX') {
                outRow[item.colName] = Math.max(...nums);
              }
            }
          } else {
            const val = groupRows[0] ? resolveField(groupRows[0], item.rawExpr) : '';
            outRow[item.colName] = val ?? '';
          }
        }
        outputRows.push(outRow);
      }
    } else if (selectListRaw === '*') {
      const sampleCols = Object.keys(baseTable[0] ?? {});
      outputRows = workingRows.map((r) => {
        const cleanRow: SqlRow = {};
        for (const c of sampleCols) cleanRow[c] = r[c];
        return cleanRow;
      });
    } else {
      outputRows = workingRows.map((r) => {
        const outRow: SqlRow = {};
        for (const item of selectItems) {
          outRow[item.colName] = resolveField(r, item.rawExpr) ?? '';
        }
        return outRow;
      });
    }

    if (isDistinct) {
      const seen = new Set<string>();
      outputRows = outputRows.filter((row) => {
        const sig = JSON.stringify(row);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }

    if (orderByClause) {
      const orderSpecs = splitTopLevelCommas(orderByClause).map((o) => {
        const parts = o.trim().split(/\s+/);
        const col = parts[0].includes('.') ? parts[0].split('.').pop()! : parts[0];
        const desc = (parts[1] ?? 'ASC').toUpperCase() === 'DESC';
        return { col, desc };
      });

      outputRows.sort((a, b) => {
        for (const spec of orderSpecs) {
          const av = a[spec.col];
          const bv = b[spec.col];
          if (av === bv) continue;
          if (typeof av === 'number' && typeof bv === 'number') {
            return spec.desc ? bv - av : av - bv;
          }
          return spec.desc
            ? String(bv).localeCompare(String(av))
            : String(av).localeCompare(String(bv));
        }
        return 0;
      });
    }

    if (limitNum !== null) {
      outputRows = outputRows.slice(0, limitNum);
    }

    const columns =
      selectItems.length > 0
        ? selectItems.map((s) => s.colName)
        : Object.keys(outputRows[0] ?? baseTable[0] ?? {});

    return {
      columns,
      rows: outputRows,
      elapsedMs: Number((performance.now() - start).toFixed(2)),
      error: null,
    };
  } catch (err) {
    return {
      columns: [],
      rows: [],
      elapsedMs: Number((performance.now() - start).toFixed(2)),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// 3. STATEFUL LINUX / BASH VIRTUAL SHELL INTERPRETER
// ============================================================================

export interface VirtualFs {
  cwd: string;
  files: Record<string, string>;
  dirs: Set<string>;
}

export function createInitialLinuxFs(): VirtualFs {
  return {
    cwd: '/home/engineer',
    dirs: new Set([
      '/',
      '/home',
      '/home/engineer',
      '/etc',
      '/etc/systemd',
      '/etc/systemd/system',
      '/var',
      '/var/log',
      '/opt',
      '/opt/pipeline',
    ]),
    files: {
      '/home/engineer/README.md': 'Linux & Bash Sandbox\nRun ls, cat, grep, wc, mkdir, touch, ps, df, systemctl status.',
      '/var/log/app.log': [
        '2026-11-20T01:10:02Z INFO Inference server listening on :8080',
        '2026-11-20T01:12:19Z INFO Loaded vision_classifier.onnx (CUDAExecutionProvider)',
        '2026-11-20T01:14:41Z ERROR Timeout calling upstream feature-store (2001ms)',
        '2026-11-20T01:15:03Z WARN Batch queue depth reached 64/128',
        '2026-11-20T01:18:22Z ERROR Corrupt JPEG header in payload id=88412',
        '2026-11-20T01:20:09Z ERROR Out-of-bounds crop bbox rejected gracefully',
        '2026-11-20T01:21:44Z INFO Healthcheck OK (p99=11.4ms)',
      ].join('\n'),
      '/etc/systemd/system/ml-inference.service': [
        '[Unit]',
        'Description=ONNX Vision Inference API',
        'After=network.target',
        '',
        '[Service]',
        'User=mlsvc',
        'WorkingDirectory=/opt/pipeline',
        'ExecStart=/opt/pipeline/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8080',
        'Restart=always',
        'MemoryMax=4G',
        '',
        '[Install]',
        'WantedBy=multi-user.target',
      ].join('\n'),
      '/opt/pipeline/deploy.sh': '#!/usr/bin/env bash\nset -euo pipefail\necho "Deploying model artifact v2.1"',
    },
  };
}

function normalizePath(cwd: string, target: string): string {
  const combined = target.startsWith('/') ? target : `${cwd === '/' ? '' : cwd}/${target}`;
  const parts = combined.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return '/' + stack.join('/');
}

function splitTokens(cmd: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: string | null = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if ((ch === '"' || ch === "'") && cmd[i - 1] !== '\\') {
      if (!quote) quote = ch;
      else if (quote === ch) quote = null;
      else cur += ch;
    } else if (/\s/.test(ch) && !quote) {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

export function runBashScript(script: string, fsState: VirtualFs): { output: string[]; nextFs: VirtualFs } {
  const nextFs: VirtualFs = {
    cwd: fsState.cwd,
    dirs: new Set(fsState.dirs),
    files: { ...fsState.files },
  };
  const vars: Record<string, string> = { HOME: '/home/engineer', USER: 'engineer' };
  const output: string[] = [];

  const expandVars = (str: string) =>
    str.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, name) => vars[name] ?? '');

  const lines = script.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('set ')) continue;

    const assignMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.+)$/);
    if (assignMatch && !line.includes(' ')) {
      let val = assignMatch[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[assignMatch[1]] = expandVars(val);
      continue;
    }

    const stages = line.split('|').map((s) => s.trim());
    let stdinText = '';

    for (const stage of stages) {
      const tokens = splitTokens(expandVars(stage));
      if (tokens.length === 0) continue;
      const cmd = tokens[0];
      const args = tokens.slice(1);

      if (cmd === 'echo') {
        stdinText = args.join(' ');
      } else if (cmd === 'pwd') {
        stdinText = nextFs.cwd;
      } else if (cmd === 'uname') {
        stdinText = args.includes('-a')
          ? 'Linux ml-prod-node-01 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux'
          : 'Linux';
      } else if (cmd === 'cd') {
        const target = normalizePath(nextFs.cwd, args[0] ?? '/home/engineer');
        if (nextFs.dirs.has(target)) {
          nextFs.cwd = target;
          stdinText = '';
        } else {
          stdinText = `bash: cd: ${args[0]}: No such directory`;
        }
      } else if (cmd === 'mkdir') {
        for (const a of args.filter((x) => !x.startsWith('-'))) {
          nextFs.dirs.add(normalizePath(nextFs.cwd, a));
        }
        stdinText = '';
      } else if (cmd === 'touch') {
        for (const a of args) {
          const p = normalizePath(nextFs.cwd, a);
          if (!(p in nextFs.files)) nextFs.files[p] = '';
        }
        stdinText = '';
      } else if (cmd === 'ls') {
        const showLong = args.some((a) => a.includes('l'));
        const pathArg = args.find((a) => !a.startsWith('-'));
        const targetDir = pathArg ? normalizePath(nextFs.cwd, pathArg) : nextFs.cwd;
        const entries: string[] = [];
        for (const d of nextFs.dirs) {
          if (d !== targetDir && d.startsWith(targetDir === '/' ? '/' : targetDir + '/')) {
            const rel = d.slice(targetDir === '/' ? 1 : targetDir.length + 1);
            if (!rel.includes('/')) entries.push(showLong ? `drwxr-xr-x  engineer  ${rel}/` : `${rel}/`);
          }
        }
        for (const f of Object.keys(nextFs.files)) {
          if (f.startsWith(targetDir === '/' ? '/' : targetDir + '/')) {
            const rel = f.slice(targetDir === '/' ? 1 : targetDir.length + 1);
            if (!rel.includes('/')) {
              entries.push(showLong ? `-rw-r--r--  ${String(nextFs.files[f].length).padStart(5)}  ${rel}` : rel);
            }
          }
        }
        stdinText = entries.sort().join('\n');
      } else if (cmd === 'cat') {
        const contents: string[] = [];
        for (const a of args) {
          const p = normalizePath(nextFs.cwd, a);
          if (p in nextFs.files) contents.push(nextFs.files[p]);
          else contents.push(`cat: ${a}: No such file`);
        }
        stdinText = contents.join('\n');
      } else if (cmd === 'grep') {
        const ignoreCase = args.some((a) => a.startsWith('-') && a.includes('i'));
        const countOnly = args.some((a) => a.startsWith('-') && a.includes('c'));
        const nonFlags = args.filter((a) => !a.startsWith('-'));
        const pattern = nonFlags[0] ?? '';
        const fileArg = nonFlags[1];
        const sourceText = fileArg ? (nextFs.files[normalizePath(nextFs.cwd, fileArg)] ?? '') : stdinText;
        const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
        const matched = sourceText.split('\n').filter((l) => l && regex.test(l));
        stdinText = countOnly ? String(matched.length) : matched.join('\n');
      } else if (cmd === 'wc') {
        const linesArr = stdinText ? stdinText.split('\n') : [];
        if (args.includes('-l')) stdinText = String(linesArr.length);
        else if (args.includes('-w')) stdinText = String(stdinText.trim().split(/\s+/).filter(Boolean).length);
        else stdinText = `${linesArr.length} lines · ${stdinText.length} bytes`;
      } else if (cmd === 'head') {
        const nIdx = args.indexOf('-n');
        const n = nIdx >= 0 ? parseInt(args[nIdx + 1] ?? '5', 10) : 5;
        const fileArg = args.find((a, idx) => !a.startsWith('-') && idx !== nIdx + 1);
        const src = fileArg ? (nextFs.files[normalizePath(nextFs.cwd, fileArg)] ?? '') : stdinText;
        stdinText = src.split('\n').slice(0, n).join('\n');
      } else if (cmd === 'tail') {
        const nIdx = args.indexOf('-n');
        const n = nIdx >= 0 ? parseInt(args[nIdx + 1] ?? '5', 10) : 5;
        const fileArg = args.find((a, idx) => !a.startsWith('-') && idx !== nIdx + 1);
        const src = fileArg ? (nextFs.files[normalizePath(nextFs.cwd, fileArg)] ?? '') : stdinText;
        stdinText = src.split('\n').slice(-n).join('\n');
      } else if (cmd === 'df') {
        stdinText = [
          'Filesystem      Size  Used Avail Use% Mounted on',
          '/dev/nvme0n1p1  120G   42G   78G  35% /',
          'tmpfs            16G  1.2G   15G   8% /dev/shm',
        ].join('\n');
      } else if (cmd === 'ps') {
        stdinText = [
          'USER       PID %CPU %MEM COMMAND',
          'root         1  0.0  0.1 /sbin/init',
          'mlsvc     1402 18.4  6.2 uvicorn app:app --port 8080',
          'postgres  1520  2.1  3.4 postgres -D /var/lib/postgresql',
        ].join('\n');
      } else if (cmd === 'systemctl') {
        const svc = args[1] ?? 'ml-inference.service';
        stdinText = [
          `● ${svc} - ONNX Vision Inference API`,
          '     Loaded: loaded (/etc/systemd/system/ml-inference.service; enabled)',
          '     Active: active (running) since Fri 2026-11-20 01:10:01 UTC',
          '   Main PID: 1402 (uvicorn) · Memory: 512.4M (max: 4.0G)',
        ].join('\n');
      } else {
        stdinText = `bash: ${cmd}: command not supported in sandbox (try ls, cat, grep, wc, head, ps, df, uname, systemctl)`;
      }
    }

    if (stdinText) output.push(stdinText);
  }

  return { output, nextFs };
}

// ============================================================================
// 4. POWERSHELL OBJECT PIPELINE SIMULATOR
// ============================================================================

type PsObject = Record<string, string | number>;

const PS_PROCESSES: PsObject[] = [
  { Name: 'pwsh', Id: 4120, CPU: 14.2, WorkingSetMB: 98 },
  { Name: 'python', Id: 5088, CPU: 84.6, WorkingSetMB: 1420 },
  { Name: 'onnx-worker', Id: 5112, CPU: 47.9, WorkingSetMB: 680 },
  { Name: 'postgres', Id: 1944, CPU: 6.4, WorkingSetMB: 310 },
  { Name: 'nginx', Id: 1120, CPU: 2.1, WorkingSetMB: 42 },
];

const PS_SERVICES: PsObject[] = [
  { Name: 'WinRM', Status: 'Running', StartType: 'Automatic' },
  { Name: 'W32Time', Status: 'Running', StartType: 'Manual' },
  { Name: 'Spooler', Status: 'Stopped', StartType: 'Disabled' },
  { Name: 'DockerEngine', Status: 'Running', StartType: 'Automatic' },
];

const PS_FILES: PsObject[] = [
  { Name: 'Deploy-SharePoint.ps1', Length: 4280, Extension: '.ps1' },
  { Name: 'Audit-Permissions.ps1', Length: 6150, Extension: '.ps1' },
  { Name: 'model_config.json', Length: 890, Extension: '.json' },
  { Name: 'training_metrics.csv', Length: 18400, Extension: '.csv' },
];

export function runPowerShellScript(script: string): string[] {
  const lines = script.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const output: string[] = [];

  for (const line of lines) {
    const stages = line.split('|').map((s) => s.trim());
    let pipeline: PsObject[] = [];

    for (const stage of stages) {
      if (/^Get-Process/i.test(stage)) {
        pipeline = [...PS_PROCESSES];
      } else if (/^Get-Service/i.test(stage)) {
        pipeline = [...PS_SERVICES];
      } else if (/^Get-ChildItem/i.test(stage) || /^dir$/i.test(stage)) {
        pipeline = [...PS_FILES];
      } else if (/^Write-Output/i.test(stage)) {
        const msg = stage.replace(/^Write-Output\s+/i, '').replace(/^['"]|['"]$/g, '');
        output.push(msg);
        pipeline = [];
      } else if (/^Where-Object/i.test(stage)) {
        const m = stage.match(/\$_\.([A-Za-z0-9_]+)\s*-(eq|ne|gt|lt|ge|le|like)\s*['"]?([^'"}\s]+)['"]?/i);
        if (m) {
          const [, prop, op, rawVal] = m;
          const numVal = Number(rawVal);
          pipeline = pipeline.filter((obj) => {
            const val = obj[prop];
            if (val === undefined) return false;
            switch (op.toLowerCase()) {
              case 'eq':
                return String(val).toLowerCase() === rawVal.toLowerCase();
              case 'ne':
                return String(val).toLowerCase() !== rawVal.toLowerCase();
              case 'gt':
                return Number(val) > numVal;
              case 'lt':
                return Number(val) < numVal;
              case 'ge':
                return Number(val) >= numVal;
              case 'le':
                return Number(val) <= numVal;
              case 'like': {
                const rx = new RegExp('^' + rawVal.replace(/\*/g, '.*') + '$', 'i');
                return rx.test(String(val));
              }
              default:
                return true;
            }
          });
        }
      } else if (/^Sort-Object/i.test(stage)) {
        const desc = /-Descending/i.test(stage);
        const parts = stage.replace(/-Descending/i, '').trim().split(/\s+/);
        const prop = parts[1];
        if (prop) {
          pipeline.sort((a, b) => {
            const av = a[prop];
            const bv = b[prop];
            if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv;
            return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
          });
        }
      } else if (/^Select-Object/i.test(stage)) {
        const propsStr = stage.replace(/^Select-Object\s+/i, '');
        const props = propsStr.split(',').map((p) => p.trim()).filter(Boolean);
        pipeline = pipeline.map((obj) => {
          const next: PsObject = {};
          for (const p of props) {
            if (p in obj) next[p] = obj[p];
          }
          return next;
        });
      } else if (/^Measure-Object/i.test(stage)) {
        const propMatch = stage.match(/-Property\s+([A-Za-z0-9_]+)/i) ?? stage.match(/^Measure-Object\s+([A-Za-z0-9_]+)/i);
        if (propMatch) {
          const prop = propMatch[1];
          const nums = pipeline.map((o) => Number(o[prop])).filter((n) => !Number.isNaN(n));
          const sum = nums.reduce((a, b) => a + b, 0);
          pipeline = [{
            Count: nums.length,
            Property: prop,
            Sum: Number(sum.toFixed(2)),
            Average: nums.length ? Number((sum / nums.length).toFixed(2)) : 0,
            Maximum: nums.length ? Math.max(...nums) : 0,
          }];
        } else {
          pipeline = [{ Count: pipeline.length }];
        }
      }
    }

    if (pipeline.length > 0) {
      const cols = Object.keys(pipeline[0]);
      const widths = cols.map((c) =>
        Math.max(c.length, ...pipeline.map((r) => String(r[c] ?? '').length))
      );
      const header = cols.map((c, i) => c.padEnd(widths[i])).join('  ');
      const sep = cols.map((_, i) => '-'.repeat(widths[i])).join('  ');
      const rows = pipeline.map((r) =>
        cols.map((c, i) => String(r[c] ?? '').padEnd(widths[i])).join('  ')
      );
      output.push([header, sep, ...rows].join('\n'));
    }
  }

  return output;
}
