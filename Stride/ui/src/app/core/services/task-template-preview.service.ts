import { Injectable } from '@angular/core';

/**
 * Renders a sample preview of a task template that uses the
 * `{{var=range:a-b}}`, `{{var=expression}}` and `{{blank}}` placeholder
 * syntax used by the AI generator.
 *
 * The renderer makes a single left-to-right pass over the placeholders so
 * each variable is bound exactly once, in source order. Subsequent
 * expressions can refer to previously-bound variables by name.
 *
 * Supported expression grammar (intentionally tiny — NO `eval`):
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/') factor)*
 *   factor  := number | identifier | 'range:' INT '-' INT | '(' expr ')'
 */
@Injectable({ providedIn: 'root' })
export class TaskTemplatePreviewService {
  /**
   * Build a preview by sampling the placeholders in `template`.
   * Returns `[preview unavailable]` if anything fails — never throws.
   */
  render(template: string | null | undefined): string {
    if (template == null || template === '') return '';

    try {
      const vars = new Map<string, number>();
      // Match `{{ ... }}` non-greedily; ignore newlines inside.
      return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, raw: string) => {
        const token = raw.trim();

        if (token === 'blank') return '___';

        // var=expression form, e.g. `a=range:5-12` or `c=a*range:3-9`
        const eqIdx = token.indexOf('=');
        if (eqIdx > 0) {
          const name = token.slice(0, eqIdx).trim();
          const expr = token.slice(eqIdx + 1).trim();
          const value = this.evaluate(expr, vars);
          if (Number.isFinite(value)) {
            vars.set(name, value);
            return this.formatNumber(value);
          }
          return '?';
        }

        // Bare identifier — reference a previously-bound variable.
        if (/^[a-zA-Z_]\w*$/.test(token)) {
          const v = vars.get(token);
          return v !== undefined ? this.formatNumber(v) : '?';
        }

        // Standalone expression with no binding (e.g. `{{ range:1-5 }}`).
        try {
          const value = this.evaluate(token, vars);
          if (Number.isFinite(value)) return this.formatNumber(value);
        } catch {
          /* fall through */
        }
        return '?';
      });
    } catch {
      return '[preview unavailable]';
    }
  }

  /** Returns true if the template contains any `{{ ... }}` placeholder. */
  hasPlaceholders(template: string | null | undefined): boolean {
    return !!template && /\{\{[^}]+\}\}/.test(template);
  }

  // ── expression evaluator ───────────────────────────────────────────────

  private evaluate(expr: string, vars: Map<string, number>): number {
    const parser = new ExprParser(expr, vars);
    const value = parser.parseExpr();
    parser.expectEof();
    return value;
  }

  private formatNumber(n: number): string {
    return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
  }
}

class ExprParser {
  private pos = 0;
  constructor(private readonly src: string, private readonly vars: Map<string, number>) {}

  parseExpr(): number {
    let value = this.parseTerm();
    while (true) {
      this.skipWs();
      const ch = this.peek();
      if (ch === '+') { this.pos++; value += this.parseTerm(); }
      else if (ch === '-') { this.pos++; value -= this.parseTerm(); }
      else break;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (true) {
      this.skipWs();
      const ch = this.peek();
      if (ch === '*') { this.pos++; value *= this.parseFactor(); }
      else if (ch === '/') {
        this.pos++;
        const divisor = this.parseFactor();
        value = divisor === 0 ? NaN : value / divisor;
      } else break;
    }
    return value;
  }

  private parseFactor(): number {
    this.skipWs();

    if (this.peek() === '(') {
      this.pos++;
      const v = this.parseExpr();
      this.skipWs();
      if (this.peek() !== ')') throw new Error('expected )');
      this.pos++;
      return v;
    }

    // range:a-b — pick a random integer in [a, b]
    if (this.matchKeyword('range:')) {
      const a = this.parseSignedInt();
      this.skipWs();
      if (this.peek() !== '-') throw new Error('expected - in range');
      this.pos++;
      const b = this.parseSignedInt();
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    // Numeric literal (allow leading minus)
    if (this.peek() === '-' || this.isDigit(this.peek())) {
      return this.parseSignedNumber();
    }

    // Identifier — variable reference
    if (this.isIdentStart(this.peek())) {
      const name = this.readIdent();
      const v = this.vars.get(name);
      if (v === undefined) throw new Error(`unbound variable ${name}`);
      return v;
    }

    throw new Error('unexpected token');
  }

  expectEof(): void {
    this.skipWs();
    if (this.pos < this.src.length) throw new Error('trailing input');
  }

  // ── lexer helpers ────────────────────────────────────────────────────

  private peek(): string { return this.src[this.pos] ?? ''; }
  private skipWs(): void { while (/\s/.test(this.peek())) this.pos++; }
  private isDigit(ch: string): boolean { return ch >= '0' && ch <= '9'; }
  private isIdentStart(ch: string): boolean { return /[a-zA-Z_]/.test(ch); }

  private matchKeyword(kw: string): boolean {
    if (this.src.startsWith(kw, this.pos)) {
      this.pos += kw.length;
      return true;
    }
    return false;
  }

  private parseSignedInt(): number {
    const sign = this.peek() === '-' ? (this.pos++, -1) : 1;
    if (!this.isDigit(this.peek())) throw new Error('expected digit');
    let n = 0;
    while (this.isDigit(this.peek())) { n = n * 10 + (this.peek().charCodeAt(0) - 48); this.pos++; }
    return sign * n;
  }

  private parseSignedNumber(): number {
    const sign = this.peek() === '-' ? (this.pos++, -1) : 1;
    let intPart = '';
    while (this.isDigit(this.peek())) { intPart += this.peek(); this.pos++; }
    let fracPart = '';
    if (this.peek() === '.') {
      this.pos++;
      while (this.isDigit(this.peek())) { fracPart += this.peek(); this.pos++; }
    }
    if (intPart === '' && fracPart === '') throw new Error('expected number');
    return sign * parseFloat((intPart || '0') + (fracPart ? '.' + fracPart : ''));
  }

  private readIdent(): string {
    let id = '';
    while (this.isIdentStart(this.peek()) || this.isDigit(this.peek())) {
      id += this.peek();
      this.pos++;
    }
    return id;
  }
}
