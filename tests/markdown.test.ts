// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'

import { renderMarkdown } from '../src/renderer/utils/markdown'

function preview(markdown: string) {
  const container = document.createElement('div')
  container.innerHTML = renderMarkdown(markdown)
  document.body.append(container)
  return container
}

afterEach(() => {
  document.body.replaceChildren()
  delete document.documentElement.dataset.piclistProbe
})

describe('renderer Markdown sanitization', () => {
  it('removes the reported raw HTML event handler before inserting the preview', () => {
    const container = preview('<img src=x onerror="document.documentElement.dataset.piclistProbe=1">')
    const image = container.querySelector('img')!

    expect(image.hasAttribute('onerror')).toBe(false)
    image.dispatchEvent(new Event('error'))
    expect(document.documentElement.dataset.piclistProbe).toBeUndefined()
  })

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'jav&#x61;script:alert(1)',
    'java&#x09;script:alert(1)',
    'java&#x0a;script:alert(1)',
    'vbscript:msgbox(1)',
    'file:///C:/private.txt',
  ])('removes unsafe href and src attributes: %s', url => {
    const container = preview(`<a href="${url}">link</a><img src="${url}">`)

    expect(container.querySelector('a')!.hasAttribute('href')).toBe(false)
    expect(container.querySelector('img')!.hasAttribute('src')).toBe(false)
  })

  it('sanitizes URLs generated from Markdown and rejects HTML data links', () => {
    const container = preview(
      '[link](javascript:alert%281%29)\n\n![image](javascript:alert%281%29)\n\n' +
        '<a href="data:text/html,<script>alert(1)</script>">data</a>',
    )

    expect(container.querySelectorAll('a')).toHaveLength(2)
    expect(container.querySelectorAll('[href], [src]')).toHaveLength(0)
  })

  it('removes active elements, styles, clobbering attributes and embedded documents', () => {
    const container = preview(`
<script>document.documentElement.dataset.piclistProbe=1</script>
<iframe srcdoc="<img src=x onerror=alert(1)>"></iframe>
<object data="https://example.com"></object><embed src="https://example.com">
<webview src="https://example.com"></webview>
<svg onload="alert(1)"><a href="javascript:alert(1)">SVG</a></svg>
<math><mtext><img src=x onerror="alert(1)"></mtext></math>
<form action="javascript:alert(1)"><input autofocus onfocus="alert(1)"></form>
<style>body { display: none }</style><link rel="stylesheet" href="https://example.com/a.css">
<base href="https://example.com"><meta http-equiv="refresh" content="0;url=https://example.com">
<p id="node" name="electron" style="position:fixed" onclick="alert(1)" data-action="remove">Text</p>
`)

    expect(
      container.querySelector(
        'script, iframe, object, embed, webview, svg, math, form, input, style, link, base, meta',
      ),
    ).toBeNull()
    expect(container.querySelector('[id], [name], [style], [onclick], [onerror], [data-action]')).toBeNull()
    expect(container.textContent).toContain('Text')
  })

  it.each([
    '<svg><textarea><img src=x onerror="alert(1)"></textarea></svg>',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
    '<IMG SRC=x ONERROR="alert(1)"><a href="javas<!-- -->cript:alert(1)">link</a>',
  ])('keeps malformed and foreign HTML inert after reparsing: %s', markdown => {
    const container = preview(markdown)

    expect(container.querySelector('svg, math, style, textarea, script, [onerror]')).toBeNull()
    for (const element of container.querySelectorAll('[href]')) {
      expect(element.getAttribute('href')).not.toMatch(/javascript:/i)
    }
  })

  it('preserves common Markdown, safe HTML, links, images, tables and line breaks', () => {
    const container = preview(
      '# Heading\n\n**bold** and *italic* and ~~deleted~~\nnext line\n\n' +
        '- first\n- second\n\n> quote\n\n' +
        '```html\n<img src=x onerror="alert(1)">\n```\n\n' +
        '[link](https://example.com "title")\n\n![image](https://example.com/image.png "image title")\n\n' +
        '| Name | Value |\n| --- | --- |\n| one | two |\n\n' +
        '<details><summary>More</summary><b>Safe HTML</b></details>',
    )

    expect(container.querySelector('h1')?.textContent).toBe('Heading')
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    expect(container.querySelector('em')?.textContent).toBe('italic')
    expect(container.querySelector('del')?.textContent).toBe('deleted')
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelector('blockquote')?.textContent).toContain('quote')
    expect(container.querySelector('br')).not.toBeNull()
    expect(container.querySelector('pre code')?.textContent).toContain('<img src=x onerror="alert(1)">')
    expect(container.querySelector('pre img')).toBeNull()
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
    expect(container.querySelector('a')?.getAttribute('title')).toBe('title')
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/image.png')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('image')
    expect(container.querySelectorAll('tbody td')).toHaveLength(2)
    expect(container.querySelector('details summary')?.textContent).toBe('More')
    expect(container.querySelector('details b')?.textContent).toBe('Safe HTML')
  })

  it('preserves the tooltip line break behavior', () => {
    expect(renderMarkdown('first\nsecond', false)).toBe('<p>first\nsecond</p>\n')
  })
})
