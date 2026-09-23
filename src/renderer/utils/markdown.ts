import DOMPurify from 'dompurify'
import { marked } from 'marked'

/** Render untrusted Markdown for insertion into the privileged renderer. */
export function renderMarkdown(content: string, breaks = true): string {
  const html = marked.parse(content, { async: false, breaks, gfm: true })

  // Keep document formatting, but exclude forms, embedded documents, styles and
  // SVG/MathML. Sanitize after parsing so Markdown links receive the same checks
  // as raw HTML. Never return the original content as an error fallback.
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'del',
      'details',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'img',
      'kbd',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'span',
      'strong',
      'sub',
      'summary',
      'sup',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'align', 'colspan', 'rowspan', 'start'],
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
  })
}
