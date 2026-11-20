import { ConsoleEntry } from './sandboxEngines';

// ============================================================================
// REAL IN-BROWSER PYTHON 3 + NUMPY SUBSET INTERPRETER
// Supports: indentation blocks, functions, lambdas, classes, f-strings,
// list comprehensions, slicing, try/except, math, random, json, and numpy.
// ============================================================================

type PyValue = any;

export class PyArray {
  data: number[][];
  shape: [number, number];
  is1D: boolean;

  constructor(raw: number[] | number[][], force1D = false) {
    if (Array.isArray(raw[0])) {
      const mat = raw as number[][];
      const rows = mat.length;
      const cols = rows > 0 ? mat[0].length : 0;
      this.data = mat.map((r) => r.map((v) => Number(v)));
      this.shape = [rows, cols];
      this.is1D = false;
    } else {
      const vec = (raw as number[]).map((v) => Number(v));
      if (force1D) {
        this.data = [vec];
        this.shape = [vec.length, 1];
        this.is1D = true;
      } else {
        this.data = [vec];
        this.shape = [1, vec.length];
        this.is1D = true;
      }
    }
  }

  static from2D(mat: number[][]): PyArray {
    return new PyArray(mat, false);
  }

  static from1D(vec: number[]): PyArray {
    const arr = new PyArray(vec, true);
    arr.is1D = true;
    arr.shape = [vec.length, 1];
    return arr;
  }

  get ndim(): number {
    return this.is1D ? 1 : 2;
  }

  get size(): number {
    return this.is1D ? this.data[0].length : this.shape[0] * this.shape[1];
  }

  get T(): PyArray {
    if (this.is1D) return PyArray.from1D([...this.data[0]]);
    const [r, c] = this.shape;
    const out: number[][] = Array.from({ length: c }, () => Array(r).fill(0));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        out[j][i] = this.data[i][j];
      }
    }
    return PyArray.from2D(out);
  }

  toArray2D(): number[][] {
    if (this.is1D) return [this.data[0]];
    return this.data;
  }

  flatten(): number[] {
    if (this.is1D) return [...this.data[0]];
    return this.data.flat();
  }

  toString(): string {
    const fmt = (n: number) => {
      if (Math.abs(n) < 1e-12) return '0.';
      return Number.isInteger(n) ? `${n}.` : n.toFixed(4).replace(/0+$/, '');
    };
    if (this.is1D) {
      return `[${this.data[0].map(fmt).join(' ')}]`;
    }
    const rows = this.data.map((r) => `[${r.map(fmt).join(' ')}]`);
    return `[${rows.join('\n ')}]`;
  }
}

function toPyArray(val: PyValue): PyArray {
  if (val instanceof PyArray) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return PyArray.from1D([Number(val)]);
  if (Array.isArray(val)) {
    if (val.length === 0) return PyArray.from1D([]);
    if (Array.isArray(val[0])) return PyArray.from2D(val as number[][]);
    return PyArray.from1D(val as number[]);
  }
  throw new Error(`Cannot convert value to numpy array`);
}

function broadcastBinary(a: PyValue, b: PyValue, op: (x: number, y: number) => number): PyValue {
  const aIsArr = a instanceof PyArray;
  const bIsArr = b instanceof PyArray;
  if (!aIsArr && !bIsArr) return op(Number(a), Number(b));

  const arrA = aIsArr ? (a as PyArray) : null;
  const arrB = bIsArr ? (b as PyArray) : null;

  if (arrA && !arrB) {
    const s = Number(b);
    if (arrA.is1D) return PyArray.from1D(arrA.data[0].map((v) => op(v, s)));
    return PyArray.from2D(arrA.data.map((r) => r.map((v) => op(v, s))));
  }
  if (!arrA && arrB) {
    const s = Number(a);
    if (arrB.is1D) return PyArray.from1D(arrB.data[0].map((v) => op(s, v)));
    return PyArray.from2D(arrB.data.map((r) => r.map((v) => op(s, v))));
  }

  const A = arrA!;
  const B = arrB!;

  if (A.is1D && B.is1D) {
    if (A.data[0].length === B.data[0].length) {
      return PyArray.from1D(A.data[0].map((v, i) => op(v, B.data[0][i])));
    }
    if (A.data[0].length === 1) return PyArray.from1D(B.data[0].map((v) => op(A.data[0][0], v)));
    if (B.data[0].length === 1) return PyArray.from1D(A.data[0].map((v) => op(v, B.data[0][0])));
  }

  const matA = A.toArray2D();
  const matB = B.toArray2D();
  const rA = matA.length;
  const cA = matA[0]?.length ?? 0;
  const rB = matB.length;
  const cB = matB[0]?.length ?? 0;

  const rOut = Math.max(rA, rB);
  const cOut = Math.max(cA, cB);

  if ((rA !== rOut && rA !== 1) || (rB !== rOut && rB !== 1) || (cA !== cOut && cA !== 1) || (cB !== cOut && cB !== 1)) {
    throw new Error(`Operands could not be broadcast together with shapes (${rA},${cA}) (${rB},${cB})`);
  }

  const out: number[][] = [];
  for (let i = 0; i < rOut; i++) {
    const row: number[] = [];
    for (let j = 0; j < cOut; j++) {
      const va = matA[rA === 1 ? 0 : i][cA === 1 ? 0 : j];
      const vb = matB[rB === 1 ? 0 : i][cB === 1 ? 0 : j];
      row.push(op(va, vb));
    }
    out.push(row);
  }
  return PyArray.from2D(out);
}

function matmulPy(a: PyValue, b: PyValue): PyValue {
  const A = toPyArray(a);
  const B = toPyArray(b);

  if (A.is1D && B.is1D) {
    const va = A.data[0];
    const vb = B.data[0];
    if (va.length !== vb.length) {
      throw new Error(`matmul: Input operand 1 has mismatch (${va.length}) vs (${vb.length})`);
    }
    let sum = 0;
    for (let i = 0; i < va.length; i++) sum += va[i] * vb[i];
    return sum;
  }

  const matA = A.is1D ? [A.data[0]] : A.data;
  const matB = B.is1D ? B.data[0].map((v) => [v]) : B.data;

  const rA = matA.length;
  const cA = matA[0]?.length ?? 0;
  const rB = matB.length;
  const cB = matB[0]?.length ?? 0;

  if (cA !== rB) {
    throw new Error(`matmul: Shape mismatch (${rA},${cA}) @ (${rB},${cB})`);
  }

  const out: number[][] = Array.from({ length: rA }, () => Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let k = 0; k < cA; k++) {
      const aik = matA[i][k];
      for (let j = 0; j < cB; j++) {
        out[i][j] += aik * matB[k][j];
      }
    }
  }

  if (A.is1D) return PyArray.from1D(out[0]);
  if (B.is1D) return PyArray.from1D(out.map((r) => r[0]));
  return PyArray.from2D(out);
}

function createRng(seed = 42) {
  let state = (seed >>> 0) || 1;
  const nextRand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const nextGaussian = () => {
    const u1 = Math.max(1e-12, nextRand());
    const u2 = nextRand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  return { nextRand, nextGaussian };
}

function makeShapeArray(sizeArg: PyValue, gen: () => number): PyValue {
  if (typeof sizeArg === 'number') {
    return PyArray.from1D(Array.from({ length: sizeArg }, gen));
  }
  if (Array.isArray(sizeArg)) {
    if (sizeArg.length === 1) return PyArray.from1D(Array.from({ length: sizeArg[0] }, gen));
    if (sizeArg.length === 2) {
      const [r, c] = sizeArg;
      return PyArray.from2D(Array.from({ length: r }, () => Array.from({ length: c }, gen)));
    }
  }
  return gen();
}

function buildNumpyModule() {
  const globalRng = createRng(42);
  return {
    pi: Math.PI,
    e: Math.E,
    array: (v: PyValue) => toPyArray(v),
    zeros: (shape: PyValue) => makeShapeArray(shape, () => 0),
    ones: (shape: PyValue) => makeShapeArray(shape, () => 1),
    eye: (n: number) =>
      PyArray.from2D(
        Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)))
      ),
    arange: (start: number, stop?: number, step = 1) => {
      const s = stop === undefined ? 0 : start;
      const e = stop === undefined ? start : stop;
      const out: number[] = [];
      for (let v = s; step > 0 ? v < e : v > e; v += step) out.push(v);
      return PyArray.from1D(out);
    },
    linspace: (start: number, stop: number, num = 50) => {
      if (num <= 1) return PyArray.from1D([start]);
      const step = (stop - start) / (num - 1);
      return PyArray.from1D(Array.from({ length: num }, (_, i) => start + i * step));
    },
    dot: (a: PyValue, b: PyValue) => matmulPy(a, b),
    matmul: (a: PyValue, b: PyValue) => matmulPy(a, b),
    exp: (v: PyValue) =>
      v instanceof PyArray
        ? v.is1D
          ? PyArray.from1D(v.data[0].map((x) => Math.exp(x)))
          : PyArray.from2D(v.data.map((r) => r.map((x) => Math.exp(x))))
        : Math.exp(Number(v)),
    log: (v: PyValue) =>
      v instanceof PyArray
        ? v.is1D
          ? PyArray.from1D(v.data[0].map((x) => Math.log(x)))
          : PyArray.from2D(v.data.map((r) => r.map((x) => Math.log(x))))
        : Math.log(Number(v)),
    sqrt: (v: PyValue) =>
      v instanceof PyArray
        ? v.is1D
          ? PyArray.from1D(v.data[0].map((x) => Math.sqrt(x)))
          : PyArray.from2D(v.data.map((r) => r.map((x) => Math.sqrt(x))))
        : Math.sqrt(Number(v)),
    tanh: (v: PyValue) =>
      v instanceof PyArray
        ? v.is1D
          ? PyArray.from1D(v.data[0].map((x) => Math.tanh(x)))
          : PyArray.from2D(v.data.map((r) => r.map((x) => Math.tanh(x))))
        : Math.tanh(Number(v)),
    abs: (v: PyValue) =>
      v instanceof PyArray
        ? v.is1D
          ? PyArray.from1D(v.data[0].map((x) => Math.abs(x)))
          : PyArray.from2D(v.data.map((r) => r.map((x) => Math.abs(x))))
        : Math.abs(Number(v)),
    maximum: (a: PyValue, b: PyValue) => broadcastBinary(a, b, (x, y) => Math.max(x, y)),
    minimum: (a: PyValue, b: PyValue) => broadcastBinary(a, b, (x, y) => Math.min(x, y)),
    where: (cond: PyValue, x: PyValue, y: PyValue) => {
      const cArr = toPyArray(cond);
      const xArr = x instanceof PyArray ? x : null;
      const yArr = y instanceof PyArray ? y : null;
      if (cArr.is1D) {
        return PyArray.from1D(
          cArr.data[0].map((cv, i) => {
            const xv = xArr ? xArr.flatten()[i % xArr.size] : Number(x);
            const yv = yArr ? yArr.flatten()[i % yArr.size] : Number(y);
            return cv ? xv : yv;
          })
        );
      }
      const [rows, cols] = cArr.shape;
      const out: number[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < cols; c++) {
          const xv = xArr ? xArr.toArray2D()[r % xArr.shape[0]][c % xArr.shape[1]] : Number(x);
          const yv = yArr ? yArr.toArray2D()[r % yArr.shape[0]][c % yArr.shape[1]] : Number(y);
          row.push(cArr.data[r][c] ? xv : yv);
        }
        out.push(row);
      }
      return PyArray.from2D(out);
    },
    sum: (v: PyValue, ...rest: PyValue[]) => {
      const kw = rest.find((r) => r && typeof r === 'object' && !(r instanceof PyArray) && !Array.isArray(r));
      const axis = kw?.axis ?? (typeof rest[0] === 'number' ? rest[0] : undefined);
      const keepdims = Boolean(kw?.keepdims);
      const arr = toPyArray(v);
      if (axis === undefined || axis === null) {
        return arr.flatten().reduce((a, b) => a + b, 0);
      }
      const mat = arr.toArray2D();
      if (axis === 0) {
        const cols = mat[0]?.length ?? 0;
        const sums = Array(cols).fill(0);
        for (const r of mat) for (let c = 0; c < cols; c++) sums[c] += r[c];
        return keepdims ? PyArray.from2D([sums]) : PyArray.from1D(sums);
      }
      const rowSums = mat.map((r) => r.reduce((a, b) => a + b, 0));
      return keepdims ? PyArray.from2D(rowSums.map((s) => [s])) : PyArray.from1D(rowSums);
    },
    mean: (v: PyValue, ...rest: PyValue[]) => {
      const kw = rest.find((r) => r && typeof r === 'object' && !(r instanceof PyArray) && !Array.isArray(r));
      const axis = kw?.axis ?? (typeof rest[0] === 'number' ? rest[0] : undefined);
      const arr = toPyArray(v);
      if (axis === undefined || axis === null) {
        const flat = arr.flatten();
        return flat.length ? flat.reduce((a, b) => a + b, 0) / flat.length : 0;
      }
      const mat = arr.toArray2D();
      if (axis === 0) {
        const cols = mat[0]?.length ?? 0;
        const sums = Array(cols).fill(0);
        for (const r of mat) for (let c = 0; c < cols; c++) sums[c] += r[c];
        return PyArray.from1D(sums.map((s) => s / mat.length));
      }
      return PyArray.from1D(mat.map((r) => r.reduce((a, b) => a + b, 0) / r.length));
    },
    std: (v: PyValue) => {
      const flat = toPyArray(v).flatten();
      if (!flat.length) return 0;
      const m = flat.reduce((a, b) => a + b, 0) / flat.length;
      return Math.sqrt(flat.reduce((a, b) => a + (b - m) ** 2, 0) / flat.length);
    },
    max: (v: PyValue) => Math.max(...toPyArray(v).flatten()),
    min: (v: PyValue) => Math.min(...toPyArray(v).flatten()),
    argmax: (v: PyValue) => {
      const flat = toPyArray(v).flatten();
      let bestIdx = 0;
      for (let i = 1; i < flat.length; i++) if (flat[i] > flat[bestIdx]) bestIdx = i;
      return bestIdx;
    },
    random: {
      default_rng: (kwargsOrSeed?: PyValue) => {
        const seedVal =
          typeof kwargsOrSeed === 'number'
            ? kwargsOrSeed
            : typeof kwargsOrSeed === 'object' && kwargsOrSeed?.seed !== undefined
            ? Number(kwargsOrSeed.seed)
            : 42;
        const rng = createRng(seedVal);
        return {
          normal: (...allArgs: PyValue[]) => {
            const last = allArgs[allArgs.length - 1];
            const isKw = last && typeof last === 'object' && !Array.isArray(last) && !(last instanceof PyArray);
            const kw = isKw ? (allArgs.pop() as Record<string, PyValue>) : {};
            const actualLoc = Number(kw.loc ?? allArgs[0] ?? 0);
            const actualScale = Number(kw.scale ?? allArgs[1] ?? 1);
            const actualSize = kw.size ?? allArgs[2];
            return makeShapeArray(actualSize, () => actualLoc + actualScale * rng.nextGaussian());
          },
          uniform: (...allArgs: PyValue[]) => {
            const last = allArgs[allArgs.length - 1];
            const isKw = last && typeof last === 'object' && !Array.isArray(last) && !(last instanceof PyArray);
            const kw = isKw ? (allArgs.pop() as Record<string, PyValue>) : {};
            const low = Number(kw.low ?? allArgs[0] ?? 0);
            const high = Number(kw.high ?? allArgs[1] ?? 1);
            const size = kw.size ?? allArgs[2];
            return makeShapeArray(size, () => low + (high - low) * rng.nextRand());
          },
          random: (size?: PyValue) => makeShapeArray(size, () => rng.nextRand()),
        };
      },
      normal: (loc = 0, scale = 1, size?: PyValue) =>
        makeShapeArray(size, () => loc + scale * globalRng.nextGaussian()),
      randn: (r: number, c?: number) =>
        c === undefined
          ? makeShapeArray(r, () => globalRng.nextGaussian())
          : makeShapeArray([r, c], () => globalRng.nextGaussian()),
    },
  };
}

// ============================================================================
// TOKENIZER
// ============================================================================

type TokType =
  | 'NUMBER'
  | 'STRING'
  | 'FSTRING'
  | 'IDENT'
  | 'OP'
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'
  | 'EOF';

interface Token {
  type: TokType;
  value: string;
  line: number;
}

const MULTI_OPS = ['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '->'];
const SINGLE_OPS = new Set(['+', '-', '*', '/', '%', '@', '=', '<', '>', '(', ')', '[', ']', '{', '}', ':', ',', '.']);

function tokenizePython(src: string): Token[] {
  const tokens: Token[] = [];
  const indentStack: number[] = [0];
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  let bracketDepth = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // Count leading spaces
    let pos = 0;
    while (pos < raw.length && (raw[pos] === ' ' || raw[pos] === '\t')) {
      pos += raw[pos] === '\t' ? 4 : 1;
    }

    // Skip blank or comment-only lines
    if (pos >= raw.length || raw[pos] === '#') continue;

    if (bracketDepth === 0) {
      const top = indentStack[indentStack.length - 1];
      if (pos > top) {
        indentStack.push(pos);
        tokens.push({ type: 'INDENT', value: '', line: lineNum });
      } else if (pos < top) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > pos) {
          indentStack.pop();
          tokens.push({ type: 'DEDENT', value: '', line: lineNum });
        }
        if (indentStack[indentStack.length - 1] !== pos) {
          throw new Error(`IndentationError on line ${lineNum}`);
        }
      }
    }

    let i = 0;
    while (i < raw.length && (raw[i] === ' ' || raw[i] === '\t')) i++;

    while (i < raw.length) {
      const ch = raw[i];
      if (ch === ' ' || ch === '\t') {
        i++;
        continue;
      }
      if (ch === '#') break;

      // f-string
      if ((ch === 'f' || ch === 'F') && (raw[i + 1] === '"' || raw[i + 1] === "'")) {
        const quote = raw[i + 1];
        i += 2;
        let content = '';
        while (i < raw.length && raw[i] !== quote) {
          if (raw[i] === '\\' && i + 1 < raw.length) {
            const esc = raw[i + 1];
            content += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
            i += 2;
          } else {
            content += raw[i++];
          }
        }
        i++; // closing quote
        tokens.push({ type: 'FSTRING', value: content, line: lineNum });
        continue;
      }

      // string
      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++;
        let content = '';
        while (i < raw.length && raw[i] !== quote) {
          if (raw[i] === '\\' && i + 1 < raw.length) {
            const esc = raw[i + 1];
            content += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
            i += 2;
          } else {
            content += raw[i++];
          }
        }
        i++;
        tokens.push({ type: 'STRING', value: content, line: lineNum });
        continue;
      }

      // number
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(raw[i + 1] ?? ''))) {
        let num = '';
        while (i < raw.length && /[0-9.]/.test(raw[i])) num += raw[i++];
        if ((raw[i] === 'e' || raw[i] === 'E') && /[0-9+-]/.test(raw[i + 1] ?? '')) {
          num += raw[i++];
          if (raw[i] === '+' || raw[i] === '-') num += raw[i++];
          while (i < raw.length && /[0-9]/.test(raw[i])) num += raw[i++];
        }
        tokens.push({ type: 'NUMBER', value: num, line: lineNum });
        continue;
      }

      // identifier / keyword
      if (/[A-Za-z_]/.test(ch)) {
        let id = '';
        while (i < raw.length && /[A-Za-z0-9_]/.test(raw[i])) id += raw[i++];
        tokens.push({ type: 'IDENT', value: id, line: lineNum });
        continue;
      }

      // multi-char operator
      const two = raw.slice(i, i + 2);
      if (MULTI_OPS.includes(two)) {
        tokens.push({ type: 'OP', value: two, line: lineNum });
        i += 2;
        continue;
      }

      if (SINGLE_OPS.has(ch)) {
        if (ch === '(' || ch === '[' || ch === '{') bracketDepth++;
        if (ch === ')' || ch === ']' || ch === '}') bracketDepth = Math.max(0, bracketDepth - 1);
        tokens.push({ type: 'OP', value: ch, line: lineNum });
        i++;
        continue;
      }

      throw new Error(`SyntaxError: Unexpected character '${ch}' on line ${lineNum}`);
    }

    if (bracketDepth === 0) {
      tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum });
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'DEDENT', value: '', line: lines.length });
  }
  tokens.push({ type: 'EOF', value: '', line: lines.length });
  return tokens;
}

// ============================================================================
// PARSER & AST
// ============================================================================

type Stmt =
  | { kind: 'expr'; expr: Expr; line: number }
  | { kind: 'assign'; target: Expr; op: string; value: Expr; line: number }
  | { kind: 'return'; value: Expr | null; line: number }
  | { kind: 'break'; line: number }
  | { kind: 'continue'; line: number }
  | { kind: 'pass'; line: number }
  | { kind: 'if'; branches: { cond: Expr | null; body: Stmt[] }[]; line: number }
  | { kind: 'while'; cond: Expr; body: Stmt[]; line: number }
  | { kind: 'for'; varNames: string[]; iter: Expr; body: Stmt[]; line: number }
  | { kind: 'def'; name: string; params: { name: string; defaultVal: Expr | null }[]; body: Stmt[]; line: number }
  | { kind: 'class'; name: string; body: Stmt[]; line: number }
  | { kind: 'import'; mod: string; alias: string; line: number }
  | { kind: 'from_import'; mod: string; names: { name: string; alias: string }[]; line: number }
  | { kind: 'try'; tryBody: Stmt[]; exceptBody: Stmt[]; exceptVar: string | null; line: number };

type Expr =
  | { kind: 'lit'; value: PyValue }
  | { kind: 'var'; name: string }
  | { kind: 'fstr'; template: string }
  | { kind: 'list'; items: Expr[] }
  | { kind: 'dict'; entries: { key: Expr; val: Expr }[] }
  | { kind: 'listcomp'; expr: Expr; varNames: string[]; iter: Expr; cond: Expr | null }
  | { kind: 'unary'; op: string; right: Expr }
  | { kind: 'bin'; op: string; left: Expr; right: Expr }
  | { kind: 'ternary'; cond: Expr; ifTrue: Expr; ifFalse: Expr }
  | { kind: 'attr'; obj: Expr; attr: string }
  | { kind: 'index'; obj: Expr; indices: { start: Expr | null; stop: Expr | null; isSlice: boolean }[] }
  | { kind: 'call'; callee: Expr; args: { name: string | null; value: Expr }[] }
  | { kind: 'lambda'; params: string[]; body: Expr };

class Parser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.i + offset, this.tokens.length - 1)];
  }
  private consume(): Token {
    return this.tokens[this.i++];
  }
  private match(type: TokType, value?: string): boolean {
    const t = this.peek();
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    this.i++;
    return true;
  }
  private expect(type: TokType, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`SyntaxError on line ${t.line}: expected ${value ?? type}, got '${t.value || t.type}'`);
    }
    return this.consume();
  }

  parseProgram(): Stmt[] {
    const stmts: Stmt[] = [];
    while (this.peek().type !== 'EOF') {
      while (this.match('NEWLINE')) {}
      if (this.peek().type === 'EOF') break;
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  private parseBlock(): Stmt[] {
    this.expect('OP', ':');
    this.expect('NEWLINE');
    this.expect('INDENT');
    const stmts: Stmt[] = [];
    while (this.peek().type !== 'DEDENT' && this.peek().type !== 'EOF') {
      while (this.match('NEWLINE')) {}
      if (this.peek().type === 'DEDENT' || this.peek().type === 'EOF') break;
      stmts.push(this.parseStmt());
    }
    this.match('DEDENT');
    return stmts;
  }

  private parseStmt(): Stmt {
    const t = this.peek();
    if (t.type === 'IDENT') {
      if (t.value === 'if') return this.parseIf();
      if (t.value === 'while') return this.parseWhile();
      if (t.value === 'for') return this.parseFor();
      if (t.value === 'def') return this.parseDef();
      if (t.value === 'class') return this.parseClass();
      if (t.value === 'import') return this.parseImport();
      if (t.value === 'from') return this.parseFromImport();
      if (t.value === 'try') return this.parseTry();
      if (t.value === 'return') {
        this.consume();
        const val = this.peek().type === 'NEWLINE' ? null : this.parseTupleOrExpr();
        this.match('NEWLINE');
        return { kind: 'return', value: val, line: t.line };
      }
      if (t.value === 'break') {
        this.consume();
        this.match('NEWLINE');
        return { kind: 'break', line: t.line };
      }
      if (t.value === 'continue') {
        this.consume();
        this.match('NEWLINE');
        return { kind: 'continue', line: t.line };
      }
      if (t.value === 'pass') {
        this.consume();
        this.match('NEWLINE');
        return { kind: 'pass', line: t.line };
      }
    }

    const expr = this.parseTupleOrExpr();
    const next = this.peek();
    if (next.type === 'OP' && ['=', '+=', '-=', '*=', '/='].includes(next.value)) {
      const op = this.consume().value;
      const val = this.parseTupleOrExpr();
      this.match('NEWLINE');
      return { kind: 'assign', target: expr, op, value: val, line: t.line };
    }
    this.match('NEWLINE');
    return { kind: 'expr', expr, line: t.line };
  }

  private parseIf(): Stmt {
    const line = this.consume().line; // if
    const branches: { cond: Expr | null; body: Stmt[] }[] = [];
    const cond = this.parseExpr();
    branches.push({ cond, body: this.parseBlock() });
    while (this.peek().type === 'IDENT' && this.peek().value === 'elif') {
      this.consume();
      const ec = this.parseExpr();
      branches.push({ cond: ec, body: this.parseBlock() });
    }
    if (this.peek().type === 'IDENT' && this.peek().value === 'else') {
      this.consume();
      branches.push({ cond: null, body: this.parseBlock() });
    }
    return { kind: 'if', branches, line };
  }

  private parseWhile(): Stmt {
    const line = this.consume().line;
    const cond = this.parseExpr();
    const body = this.parseBlock();
    return { kind: 'while', cond, body, line };
  }

  private parseFor(): Stmt {
    const line = this.consume().line;
    const varNames: string[] = [];
    const hasParen = this.match('OP', '(');
    varNames.push(this.expect('IDENT').value);
    while (this.match('OP', ',')) varNames.push(this.expect('IDENT').value);
    if (hasParen) this.expect('OP', ')');
    this.expect('IDENT', 'in');
    const iter = this.parseTupleOrExpr();
    const body = this.parseBlock();
    return { kind: 'for', varNames, iter, body, line };
  }

  private parseDef(): Stmt {
    const line = this.consume().line;
    const name = this.expect('IDENT').value;
    this.expect('OP', '(');
    const params: { name: string; defaultVal: Expr | null }[] = [];
    while (!(this.peek().type === 'OP' && this.peek().value === ')')) {
      const pName = this.expect('IDENT').value;
      // Optional type annotation: param: int
      if (this.match('OP', ':')) {
        this.parseExpr();
      }
      let defaultVal: Expr | null = null;
      if (this.match('OP', '=')) {
        defaultVal = this.parseExpr();
      }
      params.push({ name: pName, defaultVal });
      if (!this.match('OP', ',')) break;
    }
    this.expect('OP', ')');
    if (this.match('OP', '->')) {
      this.parseExpr();
    }
    const body = this.parseBlock();
    return { kind: 'def', name, params, body, line };
  }

  private parseClass(): Stmt {
    const line = this.consume().line;
    const name = this.expect('IDENT').value;
    if (this.match('OP', '(')) {
      while (!(this.peek().type === 'OP' && this.peek().value === ')')) this.consume();
      this.expect('OP', ')');
    }
    const body = this.parseBlock();
    return { kind: 'class', name, body, line };
  }

  private parseImport(): Stmt {
    const line = this.consume().line;
    let mod = this.expect('IDENT').value;
    while (this.match('OP', '.')) mod += '.' + this.expect('IDENT').value;
    let alias = mod.split('.')[0];
    if (this.peek().type === 'IDENT' && this.peek().value === 'as') {
      this.consume();
      alias = this.expect('IDENT').value;
    }
    this.match('NEWLINE');
    return { kind: 'import', mod, alias, line };
  }

  private parseFromImport(): Stmt {
    const line = this.consume().line;
    let mod = this.expect('IDENT').value;
    while (this.match('OP', '.')) mod += '.' + this.expect('IDENT').value;
    this.expect('IDENT', 'import');
    const names: { name: string; alias: string }[] = [];
    do {
      const n = this.expect('IDENT').value;
      let alias = n;
      if (this.peek().type === 'IDENT' && this.peek().value === 'as') {
        this.consume();
        alias = this.expect('IDENT').value;
      }
      names.push({ name: n, alias });
    } while (this.match('OP', ','));
    this.match('NEWLINE');
    return { kind: 'from_import', mod, names, line };
  }

  private parseTry(): Stmt {
    const line = this.consume().line;
    const tryBody = this.parseBlock();
    this.expect('IDENT', 'except');
    let exceptVar: string | null = null;
    if (!(this.peek().type === 'OP' && this.peek().value === ':')) {
      this.expect('IDENT'); // Exception class
      if (this.peek().type === 'IDENT' && this.peek().value === 'as') {
        this.consume();
        exceptVar = this.expect('IDENT').value;
      }
    }
    const exceptBody = this.parseBlock();
    return { kind: 'try', tryBody, exceptBody, exceptVar, line };
  }

  private parseTupleOrExpr(): Expr {
    const first = this.parseExpr();
    if (this.peek().type === 'OP' && this.peek().value === ',') {
      const items: Expr[] = [first];
      while (this.match('OP', ',')) {
        if (this.peek().type === 'NEWLINE' || (this.peek().type === 'OP' && this.peek().value === ')')) break;
        items.push(this.parseExpr());
      }
      return { kind: 'list', items };
    }
    return first;
  }

  private parseExpr(): Expr {
    if (this.peek().type === 'IDENT' && this.peek().value === 'lambda') {
      this.consume();
      const params: string[] = [];
      if (!(this.peek().type === 'OP' && this.peek().value === ':')) {
        params.push(this.expect('IDENT').value);
        while (this.match('OP', ',')) params.push(this.expect('IDENT').value);
      }
      this.expect('OP', ':');
      return { kind: 'lambda', params, body: this.parseExpr() };
    }
    const expr = this.parseOr();
    if (this.peek().type === 'IDENT' && this.peek().value === 'if') {
      this.consume();
      const cond = this.parseOr();
      this.expect('IDENT', 'else');
      const ifFalse = this.parseExpr();
      return { kind: 'ternary', cond, ifTrue: expr, ifFalse };
    }
    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.peek().type === 'IDENT' && this.peek().value === 'or') {
      this.consume();
      left = { kind: 'bin', op: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.peek().type === 'IDENT' && this.peek().value === 'and') {
      this.consume();
      left = { kind: 'bin', op: 'and', left, right: this.parseNot() };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.peek().type === 'IDENT' && this.peek().value === 'not') {
      this.consume();
      return { kind: 'unary', op: 'not', right: this.parseNot() };
    }
    return this.parseCmp();
  }

  private parseCmp(): Expr {
    let left = this.parseAdd();
    while (true) {
      const t = this.peek();
      if (t.type === 'OP' && ['==', '!=', '<', '>', '<=', '>='].includes(t.value)) {
        const op = this.consume().value;
        left = { kind: 'bin', op, left, right: this.parseAdd() };
      } else if (t.type === 'IDENT' && (t.value === 'in' || t.value === 'is')) {
        const op = this.consume().value;
        left = { kind: 'bin', op, left, right: this.parseAdd() };
      } else {
        break;
      }
    }
    return left;
  }

  private parseAdd(): Expr {
    let left = this.parseMul();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      left = { kind: 'bin', op, left, right: this.parseMul() };
    }
    return left;
  }

  private parseMul(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === 'OP' && ['*', '/', '//', '%', '@'].includes(this.peek().value)) {
      const op = this.consume().value;
      left = { kind: 'bin', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek().type === 'OP' && (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.consume().value;
      return { kind: 'unary', op, right: this.parseUnary() };
    }
    return this.parsePow();
  }

  private parsePow(): Expr {
    const left = this.parsePostfix();
    if (this.match('OP', '**')) {
      return { kind: 'bin', op: '**', left, right: this.parseUnary() };
    }
    return left;
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.match('OP', '.')) {
        const attr = this.expect('IDENT').value;
        expr = { kind: 'attr', obj: expr, attr };
      } else if (this.match('OP', '(')) {
        const args: { name: string | null; value: Expr }[] = [];
        while (!(this.peek().type === 'OP' && this.peek().value === ')')) {
          if (this.peek().type === 'IDENT' && this.peek(1).type === 'OP' && this.peek(1).value === '=') {
            const name = this.consume().value;
            this.consume(); // =
            args.push({ name, value: this.parseExpr() });
          } else {
            args.push({ name: null, value: this.parseExpr() });
          }
          if (!this.match('OP', ',')) break;
        }
        this.expect('OP', ')');
        expr = { kind: 'call', callee: expr, args };
      } else if (this.match('OP', '[')) {
        const indices: { start: Expr | null; stop: Expr | null; isSlice: boolean }[] = [];
        do {
          let start: Expr | null = null;
          let stop: Expr | null = null;
          let isSlice = false;
          if (!(this.peek().type === 'OP' && (this.peek().value === ':' || this.peek().value === ']' || this.peek().value === ','))) {
            start = this.parseExpr();
          }
          if (this.match('OP', ':')) {
            isSlice = true;
            if (!(this.peek().type === 'OP' && (this.peek().value === ']' || this.peek().value === ','))) {
              stop = this.parseExpr();
            }
          }
          indices.push({ start, stop, isSlice });
        } while (this.match('OP', ','));
        this.expect('OP', ']');
        expr = { kind: 'index', obj: expr, indices };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === 'NUMBER') {
      this.consume();
      return { kind: 'lit', value: Number(t.value) };
    }
    if (t.type === 'STRING') {
      this.consume();
      return { kind: 'lit', value: t.value };
    }
    if (t.type === 'FSTRING') {
      this.consume();
      return { kind: 'fstr', template: t.value };
    }
    if (t.type === 'IDENT') {
      this.consume();
      if (t.value === 'True') return { kind: 'lit', value: true };
      if (t.value === 'False') return { kind: 'lit', value: false };
      if (t.value === 'None') return { kind: 'lit', value: null };
      return { kind: 'var', name: t.value };
    }
    if (this.match('OP', '(')) {
      if (this.match('OP', ')')) return { kind: 'list', items: [] };
      const first = this.parseExpr();
      if (this.match('OP', ',')) {
        const items: Expr[] = [first];
        while (!(this.peek().type === 'OP' && this.peek().value === ')')) {
          items.push(this.parseExpr());
          if (!this.match('OP', ',')) break;
        }
        this.expect('OP', ')');
        return { kind: 'list', items };
      }
      this.expect('OP', ')');
      return first;
    }
    if (this.match('OP', '[')) {
      if (this.match('OP', ']')) return { kind: 'list', items: [] };
      const first = this.parseExpr();
      if (this.peek().type === 'IDENT' && this.peek().value === 'for') {
        this.consume();
        const varNames: string[] = [this.expect('IDENT').value];
        while (this.match('OP', ',')) varNames.push(this.expect('IDENT').value);
        this.expect('IDENT', 'in');
        const iter = this.parseOr();
        let cond: Expr | null = null;
        if (this.peek().type === 'IDENT' && this.peek().value === 'if') {
          this.consume();
          cond = this.parseExpr();
        }
        this.expect('OP', ']');
        return { kind: 'listcomp', expr: first, varNames, iter, cond };
      }
      const items: Expr[] = [first];
      while (this.match('OP', ',')) {
        if (this.peek().type === 'OP' && this.peek().value === ']') break;
        items.push(this.parseExpr());
      }
      this.expect('OP', ']');
      return { kind: 'list', items };
    }
    if (this.match('OP', '{')) {
      const entries: { key: Expr; val: Expr }[] = [];
      while (!(this.peek().type === 'OP' && this.peek().value === '}')) {
        const key = this.parseExpr();
        this.expect('OP', ':');
        const val = this.parseExpr();
        entries.push({ key, val });
        if (!this.match('OP', ',')) break;
      }
      this.expect('OP', '}');
      return { kind: 'dict', entries };
    }
    throw new Error(`SyntaxError on line ${t.line}: unexpected token '${t.value || t.type}'`);
  }
}

// ============================================================================
// EVALUATOR
// ============================================================================

class ReturnSignal {
  constructor(public value: PyValue) {}
}
class BreakSignal {}
class ContinueSignal {}

class Env {
  vars: Record<string, PyValue> = {};
  constructor(public parent: Env | null = null) {}
  get(name: string): PyValue {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    throw new Error(`NameError: name '${name}' is not defined`);
  }
  set(name: string, val: PyValue) {
    this.vars[name] = val;
  }
}

function pyFormatValue(val: PyValue, spec: string): string {
  if (!spec) return formatPyStr(val);
  const fMatch = spec.match(/^\.?(\d+)f$/);
  if (fMatch) return Number(val).toFixed(parseInt(fMatch[1], 10));
  const dMatch = spec.match(/^(\d+)d$/);
  if (dMatch) return String(Math.trunc(Number(val))).padStart(parseInt(dMatch[1], 10), ' ');
  return formatPyStr(val);
}

function formatPyStr(val: PyValue): string {
  if (val === null) return 'None';
  if (val === true) return 'True';
  if (val === false) return 'False';
  if (val instanceof PyArray) return val.toString();
  if (Array.isArray(val)) return `[${val.map(formatPyStr).join(', ')}]`;
  if (typeof val === 'object') {
    if (typeof val.__str === 'function') return val.__str();
    const entries = Object.entries(val).map(([k, v]) => `'${k}': ${formatPyStr(v)}`);
    return `{${entries.join(', ')}}`;
  }
  return String(val);
}

export function runPythonScript(code: string): { logs: ConsoleEntry[]; error: string | null; elapsedMs: number } {
  const start = performance.now();
  const logs: ConsoleEntry[] = [];
  let ops = 0;
  const MAX_OPS = 450000;

  const tick = () => {
    if (++ops > MAX_OPS) throw new Error('ExecutionTimeout: loop exceeded safe sandbox operation limit');
  };

  const modules: Record<string, PyValue> = {
    numpy: buildNumpyModule(),
    math: {
      pi: Math.PI,
      e: Math.E,
      exp: Math.exp,
      log: Math.log,
      sqrt: Math.sqrt,
      sin: Math.sin,
      cos: Math.cos,
      tanh: Math.tanh,
      floor: Math.floor,
      ceil: Math.ceil,
      pow: Math.pow,
    },
    random: (() => {
      let rng = createRng(42);
      return {
        seed: (s: number) => {
          rng = createRng(s);
        },
        random: () => rng.nextRand(),
        uniform: (a: number, b: number) => a + (b - a) * rng.nextRand(),
        randint: (a: number, b: number) => Math.floor(a + (b - a + 1) * rng.nextRand()),
        choice: (arr: PyValue[]) => arr[Math.floor(rng.nextRand() * arr.length)],
      };
    })(),
    json: {
      dumps: (v: PyValue) => JSON.stringify(v instanceof PyArray ? v.toArray2D() : v, null, 2),
      loads: (s: string) => JSON.parse(s),
    },
    statistics: {
      mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
      median: (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      },
    },
  };

  const globalEnv = new Env();
  globalEnv.set('print', (...args: PyValue[]) => {
    logs.push({ level: 'log', text: args.map(formatPyStr).join(' ') });
  });
  globalEnv.set('len', (v: PyValue) => {
    if (v instanceof PyArray) return v.is1D ? v.data[0].length : v.shape[0];
    if (typeof v === 'string' || Array.isArray(v)) return v.length;
    if (typeof v === 'object' && v !== null) return Object.keys(v).length;
    throw new Error(`TypeError: object has no len()`);
  });
  globalEnv.set('range', (a: number, b?: number, step = 1) => {
    const startVal = b === undefined ? 0 : a;
    const stopVal = b === undefined ? a : b;
    const out: number[] = [];
    for (let v = startVal; step > 0 ? v < stopVal : v > stopVal; v += step) out.push(v);
    return out;
  });
  globalEnv.set('enumerate', (arr: PyValue[], startIdx = 0) =>
    arr.map((v, i) => [startIdx + i, v])
  );
  globalEnv.set('zip', (...lists: PyValue[][]) => {
    const minLen = Math.min(...lists.map((l) => l.length));
    return Array.from({ length: minLen }, (_, i) => lists.map((l) => l[i]));
  });
  globalEnv.set('sum', (arr: number[]) => arr.reduce((a, b) => a + b, 0));
  globalEnv.set('min', (...args: PyValue[]) =>
    args.length === 1 && Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args)
  );
  globalEnv.set('max', (...args: PyValue[]) =>
    args.length === 1 && Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args)
  );
  globalEnv.set('abs', Math.abs);
  globalEnv.set('round', (v: number, n = 0) => Number(v.toFixed(n)));
  globalEnv.set('int', (v: PyValue) => Math.trunc(Number(v)));
  globalEnv.set('float', (v: PyValue) => Number(v));
  globalEnv.set('str', (v: PyValue) => formatPyStr(v));
  globalEnv.set('bool', (v: PyValue) => Boolean(v));
  globalEnv.set('list', (v: PyValue) => (v instanceof PyArray ? v.flatten() : [...v]));
  globalEnv.set('sorted', (arr: PyValue[], kwargs?: Record<string, PyValue>) => {
    const copy = [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return kwargs?.reverse ? copy.reverse() : copy;
  });

  const evalExpr = (expr: Expr, env: Env): PyValue => {
    tick();
    switch (expr.kind) {
      case 'lit':
        return expr.value;
      case 'var':
        return env.get(expr.name);
      case 'fstr': {
        return expr.template.replace(/\{([^}]+)\}/g, (_, inner) => {
          const colonIdx = inner.lastIndexOf(':');
          let exprPart = inner;
          let fmtSpec = '';
          if (colonIdx !== -1 && !inner.slice(colonIdx).includes("'") && !inner.slice(colonIdx).includes('"')) {
            exprPart = inner.slice(0, colonIdx);
            fmtSpec = inner.slice(colonIdx + 1);
          }
          const subAst = new Parser(tokenizePython(exprPart.trim())).parseProgram();
          const first = subAst[0];
          const val = first && first.kind === 'expr' ? evalExpr(first.expr, env) : '';
          return pyFormatValue(val, fmtSpec);
        });
      }
      case 'list':
        return expr.items.map((it) => evalExpr(it, env));
      case 'dict': {
        const obj: Record<string, PyValue> = {};
        for (const e of expr.entries) obj[String(evalExpr(e.key, env))] = evalExpr(e.val, env);
        return obj;
      }
      case 'listcomp': {
        const iterable = evalExpr(expr.iter, env);
        const out: PyValue[] = [];
        for (const item of iterable) {
          const local = new Env(env);
          if (expr.varNames.length === 1) {
            local.set(expr.varNames[0], item);
          } else {
            expr.varNames.forEach((vn, idx) => local.set(vn, item[idx]));
          }
          if (!expr.cond || evalExpr(expr.cond, local)) {
            out.push(evalExpr(expr.expr, local));
          }
        }
        return out;
      }
      case 'unary': {
        const r = evalExpr(expr.right, env);
        if (expr.op === '-') return r instanceof PyArray ? broadcastBinary(0, r, (a, b) => a - b) : -r;
        if (expr.op === '+') return r;
        if (expr.op === 'not') return !r;
        return r;
      }
      case 'ternary':
        return evalExpr(expr.cond, env) ? evalExpr(expr.ifTrue, env) : evalExpr(expr.ifFalse, env);
      case 'bin': {
        if (expr.op === 'and') {
          const l = evalExpr(expr.left, env);
          return l ? evalExpr(expr.right, env) : l;
        }
        if (expr.op === 'or') {
          const l = evalExpr(expr.left, env);
          return l ? l : evalExpr(expr.right, env);
        }
        const l = evalExpr(expr.left, env);
        const r = evalExpr(expr.right, env);
        switch (expr.op) {
          case '+':
            if (typeof l === 'string' || typeof r === 'string') return String(l) + String(r);
            if (Array.isArray(l) && Array.isArray(r)) return [...l, ...r];
            return broadcastBinary(l, r, (x, y) => x + y);
          case '-':
            return broadcastBinary(l, r, (x, y) => x - y);
          case '*':
            if (typeof l === 'string' && typeof r === 'number') return l.repeat(r);
            if (Array.isArray(l) && typeof r === 'number') return Array.from({ length: r }, () => l).flat();
            return broadcastBinary(l, r, (x, y) => x * y);
          case '/':
            return broadcastBinary(l, r, (x, y) => x / y);
          case '//':
            return broadcastBinary(l, r, (x, y) => Math.floor(x / y));
          case '%':
            return broadcastBinary(l, r, (x, y) => x % y);
          case '**':
            return broadcastBinary(l, r, (x, y) => x ** y);
          case '@':
            return matmulPy(l, r);
          case '==':
            return l instanceof PyArray || r instanceof PyArray ? broadcastBinary(l, r, (x, y) => (x === y ? 1 : 0)) : l === r;
          case '!=':
            return l !== r;
          case '<':
            return l instanceof PyArray || r instanceof PyArray ? broadcastBinary(l, r, (x, y) => (x < y ? 1 : 0)) : l < r;
          case '>':
            return l instanceof PyArray || r instanceof PyArray ? broadcastBinary(l, r, (x, y) => (x > y ? 1 : 0)) : l > r;
          case '<=':
            return l instanceof PyArray || r instanceof PyArray ? broadcastBinary(l, r, (x, y) => (x <= y ? 1 : 0)) : l <= r;
          case '>=':
            return l instanceof PyArray || r instanceof PyArray ? broadcastBinary(l, r, (x, y) => (x >= y ? 1 : 0)) : l >= r;
          case 'in':
            if (Array.isArray(r) || typeof r === 'string') return r.includes(l);
            if (typeof r === 'object' && r !== null) return String(l) in r;
            return false;
          case 'is':
            return l === r;
        }
        return null;
      }
      case 'attr': {
        const obj = evalExpr(expr.obj, env);
        if (obj === null || obj === undefined) throw new Error(`AttributeError: 'NoneType' has no attribute '${expr.attr}'`);
        if (obj instanceof PyArray) {
          if (expr.attr === 'T') return obj.T;
          if (expr.attr === 'shape') return obj.is1D ? [obj.data[0].length] : [...obj.shape];
          if (expr.attr === 'ndim') return obj.ndim;
          if (expr.attr === 'size') return obj.size;
          if (expr.attr === 'tolist') return () => (obj.is1D ? [...obj.data[0]] : obj.data.map((r) => [...r]));
          if (expr.attr === 'flatten') return () => PyArray.from1D(obj.flatten());
        }
        if (Array.isArray(obj)) {
          if (expr.attr === 'append') return (x: PyValue) => { obj.push(x); return null; };
          if (expr.attr === 'pop') return () => obj.pop();
          if (expr.attr === 'extend') return (xs: PyValue[]) => { obj.push(...xs); return null; };
        }
        if (typeof obj === 'string') {
          if (expr.attr === 'upper') return () => obj.toUpperCase();
          if (expr.attr === 'lower') return () => obj.toLowerCase();
          if (expr.attr === 'strip') return () => obj.trim();
          if (expr.attr === 'split') return (sep = ' ') => obj.split(sep);
          if (expr.attr === 'join') return (arr: string[]) => arr.join(obj);
        }
        if (typeof obj === 'object' && expr.attr in obj) {
          const member = obj[expr.attr];
          if (typeof member === 'function' && obj.__isInstance) {
            return (...args: PyValue[]) => member(...args);
          }
          return member;
        }
        if (typeof obj === 'object' && expr.attr === 'items') {
          return () => Object.entries(obj);
        }
        if (typeof obj === 'object' && expr.attr === 'keys') {
          return () => Object.keys(obj);
        }
        if (typeof obj === 'object' && expr.attr === 'values') {
          return () => Object.values(obj);
        }
        if (typeof obj === 'object' && expr.attr === 'get') {
          return (k: string, defVal: PyValue = null) => (k in obj ? obj[k] : defVal);
        }
        throw new Error(`AttributeError: object has no attribute '${expr.attr}'`);
      }
      case 'index': {
        const obj = evalExpr(expr.obj, env);
        if (obj instanceof PyArray) {
          if (expr.indices.length === 1 && !expr.indices[0].isSlice) {
            const idx = Number(evalExpr(expr.indices[0].start!, env));
            if (obj.is1D) {
              const norm = idx < 0 ? obj.data[0].length + idx : idx;
              return obj.data[0][norm];
            }
            const norm = idx < 0 ? obj.data.length + idx : idx;
            return PyArray.from1D(obj.data[norm]);
          }
          if (expr.indices.length === 2 && !expr.indices[0].isSlice && !expr.indices[1].isSlice) {
            const r = Number(evalExpr(expr.indices[0].start!, env));
            const c = Number(evalExpr(expr.indices[1].start!, env));
            return obj.toArray2D()[r][c];
          }
        }
        const first = expr.indices[0];
        if (first.isSlice && (Array.isArray(obj) || typeof obj === 'string')) {
          const s = first.start ? Number(evalExpr(first.start, env)) : 0;
          const e = first.stop ? Number(evalExpr(first.stop, env)) : obj.length;
          return obj.slice(s, e);
        }
        const key = evalExpr(first.start!, env);
        if (Array.isArray(obj) || typeof obj === 'string') {
          const idx = Number(key);
          return obj[idx < 0 ? obj.length + idx : idx];
        }
        return obj[String(key)];
      }
      case 'call': {
        const fn = evalExpr(expr.callee, env);
        const posArgs: PyValue[] = [];
        const kwArgs: Record<string, PyValue> = {};
        let hasKw = false;
        for (const a of expr.args) {
          const val = evalExpr(a.value, env);
          if (a.name) {
            kwArgs[a.name] = val;
            hasKw = true;
          } else {
            posArgs.push(val);
          }
        }
        if (typeof fn !== 'function') {
          throw new Error(`TypeError: '${formatPyStr(fn)}' object is not callable`);
        }
        return hasKw ? fn(...posArgs, kwArgs) : fn(...posArgs);
      }
      case 'lambda': {
        return (...args: PyValue[]) => {
          const local = new Env(env);
          expr.params.forEach((p, idx) => local.set(p, args[idx]));
          return evalExpr(expr.body, local);
        };
      }
    }
  };

  const execBlock = (stmts: Stmt[], env: Env) => {
    for (const st of stmts) {
      execStmt(st, env);
    }
  };

  const execStmt = (st: Stmt, env: Env) => {
    tick();
    switch (st.kind) {
      case 'pass':
        return;
      case 'break':
        throw new BreakSignal();
      case 'continue':
        throw new ContinueSignal();
      case 'return':
        throw new ReturnSignal(st.value ? evalExpr(st.value, env) : null);
      case 'expr':
        evalExpr(st.expr, env);
        return;
      case 'import': {
        const mod = modules[st.mod];
        if (!mod) throw new Error(`ModuleNotFoundError: No module named '${st.mod}'`);
        env.set(st.alias, mod);
        return;
      }
      case 'from_import': {
        const mod = modules[st.mod];
        if (!mod) throw new Error(`ModuleNotFoundError: No module named '${st.mod}'`);
        for (const item of st.names) {
          if (!(item.name in mod)) throw new Error(`ImportError: cannot import name '${item.name}' from '${st.mod}'`);
          env.set(item.alias, mod[item.name]);
        }
        return;
      }
      case 'assign': {
        const rhs = evalExpr(st.value, env);
        const applyOp = (cur: PyValue) => {
          if (st.op === '=') return rhs;
          if (st.op === '+=') return broadcastBinary(cur, rhs, (x, y) => x + y);
          if (st.op === '-=') return broadcastBinary(cur, rhs, (x, y) => x - y);
          if (st.op === '*=') return broadcastBinary(cur, rhs, (x, y) => x * y);
          if (st.op === '/=') return broadcastBinary(cur, rhs, (x, y) => x / y);
          return rhs;
        };

        const unpackAssign = (target: Expr, val: PyValue) => {
          if (target.kind === 'var') {
            env.set(target.name, val);
          } else if (target.kind === 'list') {
            const vals = Array.isArray(val) ? val : [];
            target.items.forEach((it, idx) => unpackAssign(it, vals[idx]));
          }
        };

        if (st.target.kind === 'var') {
          const nextVal = st.op === '=' ? rhs : applyOp(env.get(st.target.name));
          env.set(st.target.name, nextVal);
        } else if (st.target.kind === 'list') {
          unpackAssign(st.target, rhs);
        } else if (st.target.kind === 'attr') {
          const obj = evalExpr(st.target.obj, env);
          obj[st.target.attr] = st.op === '=' ? rhs : applyOp(obj[st.target.attr]);
        } else if (st.target.kind === 'index') {
          const obj = evalExpr(st.target.obj, env);
          const idx = evalExpr(st.target.indices[0].start!, env);
          obj[idx] = st.op === '=' ? rhs : applyOp(obj[idx]);
        }
        return;
      }
      case 'if': {
        for (const br of st.branches) {
          if (br.cond === null || evalExpr(br.cond, env)) {
            execBlock(br.body, env);
            break;
          }
        }
        return;
      }
      case 'while': {
        while (evalExpr(st.cond, env)) {
          try {
            execBlock(st.body, env);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'for': {
        const iterable = evalExpr(st.iter, env);
        const list = iterable instanceof PyArray ? (iterable.is1D ? iterable.data[0] : iterable.data.map((r) => PyArray.from1D(r))) : iterable;
        for (const item of list) {
          if (st.varNames.length === 1) {
            env.set(st.varNames[0], item);
          } else {
            st.varNames.forEach((vn, idx) => env.set(vn, item[idx]));
          }
          try {
            execBlock(st.body, env);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'def': {
        const fn = (...callArgs: PyValue[]) => {
          const local = new Env(env);
          const maybeKw =
            callArgs.length > st.params.length &&
            typeof callArgs[callArgs.length - 1] === 'object' &&
            callArgs[callArgs.length - 1] !== null &&
            !(callArgs[callArgs.length - 1] instanceof PyArray)
              ? (callArgs.pop() as Record<string, PyValue>)
              : {};

          st.params.forEach((p, idx) => {
            if (idx < callArgs.length) {
              local.set(p.name, callArgs[idx]);
            } else if (p.name in maybeKw) {
              local.set(p.name, maybeKw[p.name]);
            } else if (p.defaultVal) {
              local.set(p.name, evalExpr(p.defaultVal, env));
            } else {
              local.set(p.name, undefined);
            }
          });
          try {
            execBlock(st.body, local);
          } catch (sig) {
            if (sig instanceof ReturnSignal) return sig.value;
            throw sig;
          }
          return null;
        };
        env.set(st.name, fn);
        return;
      }
      case 'class': {
        const classEnv = new Env(env);
        execBlock(st.body, classEnv);
        const ctor = (...args: PyValue[]) => {
          const instance: Record<string, PyValue> = { __isInstance: true, __className: st.name };
          for (const [k, v] of Object.entries(classEnv.vars)) {
            if (typeof v === 'function') {
              instance[k] = (...mArgs: PyValue[]) => v(instance, ...mArgs);
            } else {
              instance[k] = v;
            }
          }
          if (typeof instance.__init__ === 'function') {
            instance.__init__(...args);
          }
          return instance;
        };
        env.set(st.name, ctor);
        return;
      }
      case 'try': {
        try {
          execBlock(st.tryBody, env);
        } catch (err) {
          if (err instanceof ReturnSignal || err instanceof BreakSignal || err instanceof ContinueSignal) {
            throw err;
          }
          if (st.exceptVar) {
            env.set(st.exceptVar, err instanceof Error ? err.message : String(err));
          }
          execBlock(st.exceptBody, env);
        }
        return;
      }
    }
  };

  try {
    const tokens = tokenizePython(code);
    const ast = new Parser(tokens).parseProgram();
    execBlock(ast, globalEnv);
    return {
      logs,
      error: null,
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
  } catch (err) {
    return {
      logs,
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
  }
}
