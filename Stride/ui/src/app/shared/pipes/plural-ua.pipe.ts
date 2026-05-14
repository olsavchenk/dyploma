import { Pipe, PipeTransform } from '@angular/core';

/**
 * Ukrainian-aware plural pipe.
 *
 * Usage: {{ count | pluralUa: ['учень', 'учні', 'учнів'] }}
 *
 * Forms in order:
 *   [0] — singular (1, 21, 31, ... but not 11)
 *   [1] — "few"    (2–4, 22–24, ... but not 12–14)
 *   [2] — "many"   (0, 5–20, 25–30, ...)
 */
@Pipe({
  name: 'pluralUa',
  standalone: true,
  pure: true,
})
export class PluralUaPipe implements PipeTransform {
  transform(value: number | null | undefined, forms: [string, string, string]): string {
    const n = Math.abs(Number(value) || 0);
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return forms[2];
    if (mod10 === 1) return forms[0];
    if (mod10 >= 2 && mod10 <= 4) return forms[1];
    return forms[2];
  }
}

/**
 * English-aware plural pipe.
 *
 * Usage: {{ count | pluralEn: ['student', 'students'] }}
 */
@Pipe({
  name: 'pluralEn',
  standalone: true,
  pure: true,
})
export class PluralEnPipe implements PipeTransform {
  transform(value: number | null | undefined, forms: [string, string]): string {
    const n = Math.abs(Number(value) || 0);
    return n === 1 ? forms[0] : forms[1];
  }
}
