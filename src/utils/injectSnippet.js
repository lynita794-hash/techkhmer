// Injects an admin-provided HTML snippet (e.g. Google Analytics, Google
// Search Console verification tag) into the live DOM.
//
// Why not just use dangerouslySetInnerHTML or el.innerHTML = html?
// Browsers deliberately do NOT execute <script> tags that are inserted via
// innerHTML for security reasons. To make tracking scripts actually run, we
// have to parse the snippet and manually recreate each <script> tag as a
// real DOM node (copying its attributes/src/text), which the browser will
// then execute normally.
//
// Returns a cleanup function that removes everything this call appended,
// so re-running (e.g. settings reload) doesn't duplicate tags.
export function injectHtmlSnippet(html, target) {
  if (!html || !html.trim() || !target) return () => {}

  const template = document.createElement('template')
  template.innerHTML = html

  const appended = []

  for (const node of Array.from(template.content.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
      const script = document.createElement('script')
      for (const attr of node.attributes) {
        script.setAttribute(attr.name, attr.value)
      }
      script.text = node.textContent || ''
      target.appendChild(script)
      appended.push(script)
    } else {
      const clone = node.cloneNode(true)
      target.appendChild(clone)
      appended.push(clone)
    }
  }

  return () => {
    for (const el of appended) {
      el.parentNode?.removeChild(el)
    }
  }
}
