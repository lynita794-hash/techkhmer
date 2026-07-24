// Optional deterrents against casual right-click / DevTools use, toggled
// from Admin Panel > ការកំណត់ > សុវត្ថិភាព > "ការការពារមាតិកា". Note that
// none of this is real protection — it only blocks the common entry
// points (right-click menu, F12, Ctrl+Shift+I/J, Ctrl+U). A determined
// visitor can still open DevTools via the browser's menu bar, so treat
// this purely as a mild deterrent against casual copying, not security.

// Blocks the right-click context menu. If a redirect URL is configured,
// also opens it in a new tab — right-clicking sends the visitor
// somewhere else instead of showing a context menu, discouraging repeat
// attempts (a common pattern on streaming/download sites).
function makeContextMenuHandler(redirectUrl) {
  return (e) => {
    e.preventDefault()
    if (redirectUrl) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer')
    }
  }
}

// Intercepts the keyboard shortcuts that normally open DevTools or the
// page source, and swallows the event before the browser acts on it.
function blockDevtoolsKeys(e) {
  const key = e.key
  const isF12 = key === 'F12'
  const isInspect =
    (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')
  const isViewSource = (e.ctrlKey || e.metaKey) && key === 'U'

  if (isF12 || isInspect || isViewSource) {
    e.preventDefault()
    e.stopPropagation()
  }
}

// Applies the enabled deterrents to the document and returns a cleanup
// function that removes them again — call from a useEffect once site
// settings have loaded, matching the same on/off + cleanup pattern used
// for theme CSS and injected header/footer snippets in App.jsx.
export function applyContentProtection({
  disableRightClick,
  disableDevtools,
  rightClickRedirectUrl,
}) {
  const contextMenuHandler = makeContextMenuHandler(rightClickRedirectUrl)

  if (disableRightClick) {
    document.addEventListener('contextmenu', contextMenuHandler)
  }
  if (disableDevtools) {
    document.addEventListener('keydown', blockDevtoolsKeys, true)
  }

  return () => {
    document.removeEventListener('contextmenu', contextMenuHandler)
    document.removeEventListener('keydown', blockDevtoolsKeys, true)
  }
}
