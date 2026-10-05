import sanitizeHtml from 'sanitize-html';

/**
 * Whitelist matching exactly what the editor can produce (plus a few harmless extras that
 * imported .md/.docx files commonly contain). Everything else, including scripts, event
 * handlers, iframes, and inline styles, is stripped. This is the XSS boundary: content is
 * rendered as HTML in the browser, so it must be cleaned on the way in.
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr',
    ],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      h4: 'h3',
      h5: 'h3',
      h6: 'h3',
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
