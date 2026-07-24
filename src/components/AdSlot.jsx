import { useEffect, useRef } from 'react'
import './AdSlot.css'

// Renders admin-managed ad units for a given placement (see
// src/config/adPlacements.js for the fixed list of placements). Ad `code`
// is raw HTML/JS (banner <img>/<a>, AdSense <script>, etc.) so we reuse the
// same "recreate <script> tags manually" trick as injectSnippet.js — inline
// scripts inserted via innerHTML are not executed by the browser.
// Exported so OverlayPlayerAd/FloatingAds (which need custom positioning +
// a close button around the ad, instead of AdSlot's plain content-flow
// wrapper) can reuse the same script-injection logic without duplicating it.
export function AdUnit({ code }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !code) return

    const template = document.createElement('template')
    template.innerHTML = code

    const appended = []
    for (const node of Array.from(template.content.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
        const script = document.createElement('script')
        for (const attr of node.attributes) script.setAttribute(attr.name, attr.value)
        script.text = node.textContent || ''
        container.appendChild(script)
        appended.push(script)
      } else {
        const clone = node.cloneNode(true)
        container.appendChild(clone)
        appended.push(clone)
      }
    }

    return () => {
      for (const el of appended) el.parentNode?.removeChild(el)
    }
  }, [code])

  return <div className="ad-unit" ref={containerRef} />
}

function AdSlot({ ads, placement }) {
  const matching = ads.filter((ad) => ad.placement === placement)
  if (matching.length === 0) return null

  return (
    <div className={`ad-slot ad-slot-${placement}`}>
      {matching.map((ad) => (
        <AdUnit key={ad.id} code={ad.code} />
      ))}
    </div>
  )
}

export default AdSlot
