import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe to sanitize HTML content before rendering.
 * 
 * SECURITY NOTE: This pipe relies on backend sanitization for AI-generated content.
 * The backend MUST sanitize all task content before storing in MongoDB to prevent XSS.
 * This pipe provides defense-in-depth by using Angular's built-in HTML sanitizer.
 * 
 * Usage: <span [innerHTML]="content | safeHtml"></span>
 * 
 * For stricter sanitization, consider using DOMPurify library instead.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    // Angular's DomSanitizer.bypassSecurityTrustHtml should only be used
    // when content is known to be safe. Instead, we let Angular sanitize
    // the content naturally via innerHTML binding after stripping dangerous tags.

    // Strip potentially dangerous elements and attributes
    const sanitizedHtml = this.sanitizeHtml(value);

    return sanitizedHtml;
  }

  private sanitizeHtml(html: string): string {
    // Create a temporary DOM element to parse and sanitize
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Remove all script tags
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove event handlers from all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove all on* attributes (onclick, onerror, etc.)
      const attributeNames = el.getAttributeNames();
      attributeNames.forEach((attr) => {
        if (attr.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr);
        }
        // Remove javascript: URLs
        const value = el.getAttribute(attr);
        if (value && value.toLowerCase().includes('javascript:')) {
          el.removeAttribute(attr);
        }
      });
    });

    // Remove dangerous elements
    const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'meta', 'link', 'style', 'base'];
    dangerousTags.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    return doc.body.innerHTML;
  }
}
