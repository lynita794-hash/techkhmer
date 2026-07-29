import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './VideoPlayer.css'

function isHlsSource(url) {
  return typeof url === 'string' && /\.m3u8(\?.*)?$/i.test(url)
}

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Thin, rounded outline icon set — matches the reference player skin
// exactly: every glyph is a light-stroke outline (not filled), with
// generously rounded joins/caps so shapes like the play triangle and
// skip icons look soft rather than sharp.
const outlineIconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function PlayIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M7 4.5v15c0 .8.9 1.27 1.55.82l10-7.5c.55-.4.55-1.24 0-1.64l-10-7.5C7.9 3.23 7 3.7 7 4.5z" />
    </svg>
  )
}

function PauseIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  )
}

// "Previous/next track"-style skip glyph — a play-triangle sitting
// against a vertical bar, matching the reference image exactly (not the
// circular-arrow "rewind 10s" icon used previously).
function RewindIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M17 5v14l-10-7 10-7z" />
      <line x1="7" y1="5" x2="7" y2="19" />
    </svg>
  )
}

function ForwardIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M7 5v14l10-7-10-7z" />
      <line x1="17" y1="5" x2="17" y2="19" />
    </svg>
  )
}

function VolumeHighIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M4 9.5v5h3.5l5 4V5.5l-5 4H4z" />
      <path d="M16.5 9a3.5 3.5 0 0 1 0 6" />
    </svg>
  )
}

function VolumeLowIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M4 9.5v5h3.5l5 4V5.5l-5 4H4z" />
      <path d="M16.5 10.2a1.8 1.8 0 0 1 0 3.6" />
    </svg>
  )
}

function MuteIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M4 9.5v5h3.5l5 4V5.5l-5 4H4z" />
      <line x1="15.5" y1="10" x2="20" y2="14.5" />
      <line x1="20" y1="10" x2="15.5" y2="14.5" />
    </svg>
  )
}

// Literal "CC" letters inside a rounded rectangle badge, matching the
// reference image exactly (rather than a captions-glyph icon).
function ClosedCaptionIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} width={size} height={size}>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <text
        x="12"
        y="14.5"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="Arial, sans-serif"
      >
        CC
      </text>
    </svg>
  )
}

function SettingsIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// Four separate corner brackets, matching the reference image's
// fullscreen icon exactly (rather than a single continuous outline).
function FullscreenIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function ExitFullscreenIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M9 3v3a2 2 0 0 1-2 2H4" />
      <path d="M15 3v3a2 2 0 0 0 2 2h3" />
      <path d="M9 21v-3a2 2 0 0 0-2-2H4" />
      <path d="M15 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function CheckIcon({ size = 14 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size} strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PipIcon({ size = 20 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <rect x="3" y="4" width="18" height="14" rx="1.5" />
      <rect x="12" y="11" width="7" height="5" rx="1" />
    </svg>
  )
}

function ReplayIcon({ size = 22 }) {
  return (
    <svg {...outlineIconProps} width={size} height={size}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <polyline points="3 4 3 9 8 9" />
    </svg>
  )
}

// Mobile-only "seek 10s" glyphs — a circular counter-clockwise/clockwise
// arrow with the "10" label inside, matching the reference skin (used
// only in the mobile center play cluster, distinct from the desktop
// RewindIcon/ForwardIcon skip-track glyphs used in the bottom bar).
// Solid-filled play/pause glyphs for the mobile center cluster's accent
// circle button — a filled triangle/bars reads more clearly at that size
// against the colored circle than the thin-stroke outline icons used
// elsewhere in the bar.
function MobilePlayIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
  )
}

function MobilePauseIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect fill="currentColor" x="6" y="5" width="4" height="14" rx="1" />
      <rect fill="currentColor" x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function RewindTenIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M12 5a7 7 0 1 1-6.7 9" />
      <polyline points="6.5 2.5 5.3 6.5 9.3 7.3" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Arial, sans-serif">
        10
      </text>
    </svg>
  )
}

function ForwardTenIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M12 5a7 7 0 1 1 6.7 9" />
      <polyline points="17.5 2.5 18.7 6.5 14.7 7.3" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Arial, sans-serif">
        10
      </text>
    </svg>
  )
}

// Converts SubRip (.srt) subtitle text into WebVTT format, which is the only
// format the HTML5 <track> element can render natively.
function srtToVtt(srtText) {
  const body = srtText
    .replace(/\r+/g, '')
    // SRT uses "," for milliseconds, VTT requires "."
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
  return `WEBVTT\n\n${body}`
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]
const CONTROLS_HIDE_DELAY = 2800
const VOLUME_STORAGE_KEY = 'dramatv_player_volume'
const RESUME_THRESHOLD_SECONDS = 15 // don't bother resuming if less than this was watched
const AUTO_NEXT_COUNTDOWN = 8 // seconds shown on the "up next" overlay before auto-advancing

function VideoPlayer({
  src,
  poster,
  subtitles = [],
  onProgress,
  initialPosition = 0,
  hasNext = false,
  nextTitle = '',
  onNext,
  onEpisodeComplete,
  autoPlay = false,
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const seekTrackRef = useRef(null)
  const hideTimerRef = useRef(null)
  const lastReportedRef = useRef(0) // last currentTime we called onProgress with
  const countdownTimerRef = useRef(null)
  const hlsRef = useRef(null) // current hls.js instance, if any (m3u8 sources on non-Safari browsers)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOLUME_STORAGE_KEY))
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 1
  })
  const [muted, setMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [ended, setEnded] = useState(false)
  const [subtitleOn, setSubtitleOn] = useState(false)
  const [vttSubtitles, setVttSubtitles] = useState([]) // [{ label, url }] with blob/vtt URLs
  const [activeSubIndex, setActiveSubIndex] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsView, setSettingsView] = useState('root') // 'root' | 'speed' | 'subtitles'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPipActive, setIsPipActive] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hoverPreview, setHoverPreview] = useState(null) // { pct, time } | null
  const [autoNextCountdown, setAutoNextCountdown] = useState(null) // number | null
  const initialSeekDoneRef = useRef(false) // have we applied the resume-position seek yet?
  const startedRef = useRef(false) // has the user actually pressed play yet?
  const resumeDoneRef = useRef(false) // have we applied initialPosition for this src yet?
  const cancelledNextRef = useRef(false) // user dismissed the auto-next overlay
  const autoPlayAttemptedRef = useRef(false) // have we tried autoplay for this src yet?
  const [showUnmuteHint, setShowUnmuteHint] = useState(false) // shown when autoplay only worked muted

  // Show the CC/subtitle option whenever this episode actually has
  // subtitle tracks loaded — no longer gated by the drama-wide
  // hasSubtitle flag, since the Admin Panel toggle for that field was
  // removed and there's no way for admins to turn it back on. Per-
  // episode control now lives entirely in the episode's own subtitle
  // list (Admin Drama Form > Video Episodes > CC).
  const showSubtitleOption = vttSubtitles.length > 0
  const supportsPip = typeof document !== 'undefined' && document.pictureInPictureEnabled

  // --- Auto-hide controls after inactivity while playing ---
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      if (playing && !settingsOpen && !isScrubbing) setControlsVisible(false)
    }, CONTROLS_HIDE_DELAY)
  }, [playing, settingsOpen, isScrubbing])

  const wake = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [scheduleHide])

  useEffect(() => {
    if (!playing) setControlsVisible(true)
  }, [playing])

  // Close the settings dropdown when clicking anywhere outside of it
  useEffect(() => {
    if (!settingsOpen) return
    const handleClickOutside = (e) => {
      if (!e.target.closest?.('.settings-menu-wrapper')) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  // Keep isFullscreen in sync with the actual browser fullscreen state,
  // including changes triggered by Esc key or the browser's native UI.
  useEffect(() => {
    const handleChange = () => {
      const fsElement =
        document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(fsElement === containerRef.current)
    }

    document.addEventListener('fullscreenchange', handleChange)
    document.addEventListener('webkitfullscreenchange', handleChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('webkitfullscreenchange', handleChange)
    }
  }, [])

  const toggleSubtitle = () => {
    const video = videoRef.current
    if (!video) return
    const next = !subtitleOn
    for (const track of video.textTracks) {
      track.mode = next && track.language === String(activeSubIndex) ? 'showing' : 'hidden'
    }
    setSubtitleOn(next)
  }

  const selectSubtitle = (index) => {
    setActiveSubIndex(index)
    setSubtitleOn(true)
    const video = videoRef.current
    if (!video) return
    for (const track of video.textTracks) {
      track.mode = track.language === String(index) ? 'showing' : 'hidden'
    }
  }

  const selectSubtitleOff = () => {
    setSubtitleOn(false)
    const video = videoRef.current
    if (video) {
      for (const track of video.textTracks) track.mode = 'hidden'
    }
  }

  // Load each subtitle file and convert it to VTT (via blob URL) if needed,
  // since browsers only support WebVTT natively — not .srt.
  useEffect(() => {
    const validSubs = (subtitles || []).filter((s) => s.url)
    if (validSubs.length === 0) {
      setVttSubtitles([])
      return
    }

    let cancelled = false
    const objectUrls = []

    Promise.all(
      validSubs.map(async (sub) => {
        const isVtt = sub.url.toLowerCase().endsWith('.vtt')
        if (isVtt) return { label: sub.label || 'Subtitle', url: sub.url }

        try {
          const res = await fetch(sub.url)
          const text = await res.text()
          const vttText = srtToVtt(text)
          const blob = new Blob([vttText], { type: 'text/vtt' })
          const objectUrl = URL.createObjectURL(blob)
          objectUrls.push(objectUrl)
          return { label: sub.label || 'Subtitle', url: objectUrl }
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      setVttSubtitles(results.filter(Boolean))
      setActiveSubIndex(0)
      // CC starts off by default for every newly-published/loaded episode
      // — the viewer has to press the CC button themselves to turn it on,
      // rather than subtitles auto-appearing.
      setSubtitleOn(false)
    })

    return () => {
      cancelled = true
      objectUrls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [subtitles])

  // Loads `src` into the <video> element whenever it changes. Plain .mp4
  // (and any format the browser supports natively) just gets assigned to
  // video.src directly. .m3u8 (HLS) needs special handling: Safari/iOS
  // support HLS natively via video.src, but Chrome/Firefox/Edge don't —
  // those need hls.js to demux the stream in JS and feed it to the video
  // element via MediaSource Extensions. canPlayType check picks the right
  // path per-browser instead of assuming one or the other.
  //
  // hls.js is dynamically imported (not a static top-level import) so its
  // ~200KB doesn't get bundled into every visitor's initial page load —
  // most dramas are plain .mp4, so the vast majority of visitors never
  // need it at all. Only fetched the first time an .m3u8 source actually
  // appears.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setPlaying(false)
    setCurrent(0)
    setBuffered(0)

    // Tear down any previous hls.js instance before loading a new source —
    // reusing one across episodes can leak internal state/listeners.
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    let cancelled = false

    if (isHlsSource(src) && !video.canPlayType('application/vnd.apple.mpegurl')) {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(src)
          hls.attachMedia(video)
          // Fatal hls.js errors (network/media failures during manifest
          // or segment loading) don't always surface through the
          // <video> element's native `error` event, since hls.js
          // intercepts the stream itself — so they need to be forwarded
          // manually to the same "couldn't load video" overlay used for
          // regular playback errors.
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setIsLoading(false)
              setHasError(true)
              setPlaying(false)
            }
          })
          hlsRef.current = hls
        } else {
          // Neither native HLS nor hls.js/MSE available — let the
          // normal onError handler show the "couldn't load video"
          // overlay.
          video.src = src
          video.load()
        }
      })
    } else {
      video.src = src
      video.load()
    }

    video.playbackRate = playbackRate
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Clean up the hls.js instance when the player itself unmounts (not
  // just on src change, which is already handled above).
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  // Reset per-episode state whenever the src changes (new episode/movie).
  useEffect(() => {
    initialSeekDoneRef.current = false
    startedRef.current = false
    resumeDoneRef.current = false
    cancelledNextRef.current = false
    autoPlayAttemptedRef.current = false
    lastReportedRef.current = 0
    setHasError(false)
    setEnded(false)
    setAutoNextCountdown(null)
    setShowUnmuteHint(false)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
  }, [src])

  // Cover/thumbnail before playback starts now comes purely from the
  // drama's Backdrop/Banner image (the `poster` prop, set from Admin
  // Drama Form > TMDB import) — no longer auto-grabbing a frame from the
  // video itself. The only silent seek left is for "Continue Watching":
  // if there's a meaningful saved position, jump there right away so
  // playback picks up where the viewer left off.
  const handleLoadedData = (e) => {
    setIsLoading(false)
    setHasError(false)
    const video = e.target
    if (initialSeekDoneRef.current || startedRef.current) {
      attemptAutoPlay(video)
      return
    }

    const canResume = initialPosition > RESUME_THRESHOLD_SECONDS
    if (canResume) {
      const target = Math.min(initialPosition, Math.max((video.duration || initialPosition) - 1, 0))
      if (target > 0) {
        initialSeekDoneRef.current = true
        resumeDoneRef.current = true
        video.currentTime = target
        setCurrent(target)
      }
    }

    attemptAutoPlay(video)
  }

  // Starts playback automatically once the episode/movie has loaded, if
  // the site-wide "Auto Play Video" setting is on. Tries unmuted first
  // (matches manual play behavior); if the browser's autoplay policy
  // blocks that (most browsers require either a prior user interaction
  // or muted playback), falls back to a muted autoplay and shows a
  // "tap to unmute" hint instead of silently failing to play at all.
  // Guarded by autoPlayAttemptedRef so this only ever fires once per
  // episode — handleLoadedData/onCanPlay can otherwise fire multiple
  // times for the same load.
  const attemptAutoPlay = (video) => {
    if (!autoPlay || autoPlayAttemptedRef.current || startedRef.current) return
    autoPlayAttemptedRef.current = true
    startedRef.current = true
    if (!resumeDoneRef.current) video.currentTime = 0

    video
      .play()
      .then(() => {
        setPlaying(true)
      })
      .catch(() => {
        video.muted = true
        setMuted(true)
        video
          .play()
          .then(() => {
            setPlaying(true)
            setShowUnmuteHint(true)
          })
          .catch(() => {
            // Autoplay blocked entirely even muted — leave the normal
            // center Play button as the fallback.
            startedRef.current = false
            autoPlayAttemptedRef.current = false
          })
      })
  }

  const dismissUnmuteHint = () => {
    const video = videoRef.current
    if (video) {
      video.muted = false
      setMuted(false)
    }
    setShowUnmuteHint(false)
  }

  const handleVideoError = () => {
    setIsLoading(false)
    setHasError(true)
    setPlaying(false)
  }

  const retryPlayback = () => {
    const video = videoRef.current
    if (!video) return
    setHasError(false)
    setIsLoading(true)
    // For hls.js-managed sources, video.load() would reset the element
    // out from under hls.js's internal state — reloading the source
    // through hls.js itself is the correct way to retry.
    if (hlsRef.current) {
      hlsRef.current.loadSource(src)
    } else {
      video.load()
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      // First real play of this episode — jump back to the very start
      // before playing, unless we're resuming from a saved position
      // (resumeDoneRef), in which case we stay right where the silent
      // seek already put us.
      if (!startedRef.current) {
        startedRef.current = true
        if (!resumeDoneRef.current) {
          video.currentTime = 0
        }
      }
      video.play()
      setPlaying(true)
      setEnded(false)
    } else {
      video.pause()
      setPlaying(false)
    }
    wake()
  }

  // --- Auto-play next episode, with a cancellable countdown overlay ---
  const handleEnded = () => {
    setPlaying(false)
    setEnded(true)
    onEpisodeComplete?.()
    if (hasNext && onNext && !cancelledNextRef.current) {
      setAutoNextCountdown(AUTO_NEXT_COUNTDOWN)
    }
  }

  useEffect(() => {
    if (autoNextCountdown === null) return
    if (autoNextCountdown <= 0) {
      onNext?.()
      return
    }
    countdownTimerRef.current = setTimeout(() => {
      setAutoNextCountdown((c) => (c === null ? null : c - 1))
    }, 1000)
    return () => clearTimeout(countdownTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNextCountdown])

  const cancelAutoNext = () => {
    cancelledNextRef.current = true
    setAutoNextCountdown(null)
  }

  const replay = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play()
    setPlaying(true)
    setEnded(false)
    setAutoNextCountdown(null)
  }

  const skip = (secs) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(
      Math.max(video.currentTime + secs, 0),
      video.duration || 0,
    )
    wake()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    wake()
  }

  const handleVolumeChange = (e) => {
    const video = videoRef.current
    if (!video) return
    const next = Number(e.target.value)
    video.volume = next
    video.muted = next === 0
    setVolume(next)
    setMuted(next === 0)
    localStorage.setItem(VOLUME_STORAGE_KEY, String(next))
    wake()
  }

  // Apply the saved volume to each new <video> element (video.load() in
  // the src-change effect above resets volume to 1, so this needs to
  // re-run per episode, not just once on mount).
  useEffect(() => {
    const video = videoRef.current
    if (video) video.volume = volume
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const togglePip = async () => {
    const video = videoRef.current
    if (!video || !supportsPip) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch {
      // Some browsers throw if the video isn't ready yet — safe to ignore,
      // worst case the button just doesn't do anything that click.
    }
    wake()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnter = () => setIsPipActive(true)
    const onLeave = () => setIsPipActive(false)
    video.addEventListener('enterpictureinpicture', onEnter)
    video.addEventListener('leavepictureinpicture', onLeave)
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter)
      video.removeEventListener('leavepictureinpicture', onLeave)
    }
  }, [])

  const changePlaybackRate = (rate) => {
    const video = videoRef.current
    if (video) video.playbackRate = rate
    setPlaybackRate(rate)
    setSettingsView('root')
    setSettingsOpen(false)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return

    const fsElement = document.fullscreenElement || document.webkitFullscreenElement

    if (fsElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      }
    } else if (el.requestFullscreen) {
      el.requestFullscreen()
    } else if (el.webkitRequestFullscreen) {
      // Safari / older WebKit browsers
      el.webkitRequestFullscreen()
    } else if (videoRef.current?.webkitEnterFullscreen) {
      // iOS Safari only supports fullscreen on the <video> element itself
      videoRef.current.webkitEnterFullscreen()
    }
    wake()
  }

  // --- Custom scrubber: click-to-seek + drag-to-scrub, with a hover preview ---
  const ratioFromClientX = useCallback((clientX) => {
    const track = seekTrackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }, [])

  const seekToRatio = useCallback(
    (ratio) => {
      const video = videoRef.current
      if (!video || !duration) return
      video.currentTime = ratio * duration
      setCurrent(ratio * duration)
    },
    [duration],
  )

  const handleScrubMove = useCallback(
    (clientX) => {
      const ratio = ratioFromClientX(clientX)
      setHoverPreview({ pct: ratio * 100, time: ratio * duration })
      if (isScrubbing) seekToRatio(ratio)
    },
    [ratioFromClientX, duration, isScrubbing, seekToRatio],
  )

  const handleSeekMouseDown = (e) => {
    setIsScrubbing(true)
    handleScrubMove(e.clientX)
    wake()
  }

  const handleSeekTouchStart = (e) => {
    // Without this, starting a touch-drag on the seek bar also triggers the
    // page's native vertical scroll/pull-to-refresh gesture, so the user
    // ends up scrolling the page instead of (or in addition to) scrubbing
    // the video — very jarring on mobile.
    e.preventDefault()
    setIsScrubbing(true)
    handleScrubMove(e.touches[0].clientX)
    wake()
  }

  useEffect(() => {
    if (!isScrubbing) return

    const onMouseMove = (e) => handleScrubMove(e.clientX)
    const onTouchMove = (e) => {
      e.preventDefault()
      handleScrubMove(e.touches[0].clientX)
    }
    const stop = () => setIsScrubbing(false)

    window.addEventListener('mousemove', onMouseMove)
    // passive: false is required for preventDefault() to actually take
    // effect on touchmove — modern browsers default touch listeners to
    // passive (for scroll performance), which silently ignores
    // preventDefault() unless explicitly opted out here.
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [isScrubbing, handleScrubMove])

  // --- Keyboard shortcuts (only when the player has focus) ---
  const handleKeyDown = (e) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        skip(-10)
        break
      case 'ArrowRight':
        e.preventDefault()
        skip(10)
        break
      case 'm':
        toggleMute()
        break
      case 'f':
        toggleFullscreen()
        break
      default:
        break
    }
  }

  const progress = duration ? (current / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  const volumeIcon = useMemo(() => {
    if (muted || volume === 0) return <MuteIcon size={26} />
    if (volume < 0.5) return <VolumeLowIcon size={26} />
    return <VolumeHighIcon size={26} />
  }, [muted, volume])

  return (
    <div
      className={`video-player ${controlsVisible ? 'controls-visible' : 'controls-hidden'}`}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={wake}
      onTouchStart={wake}
      onMouseLeave={() => playing && !isScrubbing && setControlsVisible(false)}
    >
      {poster && (
        <div
          className="video-ambient-bg"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      <video
        ref={videoRef}
        className="video-el"
        poster={poster}
        playsInline
        webkit-playsinline="true"
        onTimeUpdate={(e) => {
          // Ignore time updates from the silent resume-position seek —
          // only track progress once playback has actually started, so
          // the seek bar/time label don't jump ahead before the user
          // presses play.
          if (!startedRef.current) return
          const time = e.target.currentTime
          setCurrent(time)

          // Report watch progress (for "Continue Watching") at most every
          // ~10s of playback, not on every timeupdate event (which fires
          // several times a second) — avoids spamming the API.
          if (onProgress && time - lastReportedRef.current >= 10) {
            lastReportedRef.current = time
            onProgress(time)
          }
        }}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onLoadedData={handleLoadedData}
        onProgress={(e) => {
          const video = e.target
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1))
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={handleEnded}
        onError={handleVideoError}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      >
        {vttSubtitles.map((sub, index) => (
          // No `default` attribute — CC starts off for every episode, so
          // the browser shouldn't auto-activate any track on its own.
          <track
            key={sub.url}
            kind="subtitles"
            src={sub.url}
            srcLang={String(index)}
            label={sub.label}
          />
        ))}
      </video>

      {isLoading && !hasError && (
        <div className="video-spinner" aria-hidden="true">
          <span className="video-spinner-ring" />
          <span className="video-spinner-ring" />
          <span className="video-spinner-ring" />
        </div>
      )}

      {showUnmuteHint && (
        <button className="unmute-hint-btn" onClick={dismissUnmuteHint}>
          <MuteIcon size={16} />
          ចុចដើម្បីស្តាប់សំឡេង (Tap to unmute)
        </button>
      )}

      {hasError && (
        <div className="video-error-overlay">
          <p>មិនអាចផ្ទុកវីដេអូបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ឬព្យាយាមម្តងទៀត។</p>
          <button className="video-retry-btn" onClick={retryPlayback}>
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      )}

      {!playing && !isLoading && !hasError && !ended && (
        <button
          className="center-play-btn mobile-hide-ctrl"
          onClick={togglePlay}
          aria-label="Play"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
            <path d="M7.5 4.2c-.9-.55-2 .1-2 1.15v13.3c0 1.05 1.1 1.7 2 1.15l11.2-6.65c.85-.5.85-1.75 0-2.3L7.5 4.2z" />
          </svg>
        </button>
      )}

      {/* Mobile-only center cluster shown over the video itself — matches
          the reference skin: Rewind10 / Play-Pause (in an accent-colored
          circle) / Forward10. Hidden on desktop/tablet since the
          bottom-bar controls-group-left already covers the same actions
          there (see .mobile-center-cluster CSS). */}
      {!isLoading && !hasError && !ended && (
        <div className="mobile-center-cluster">
          <button className="mobile-cluster-btn" onClick={() => skip(-10)} aria-label="Rewind 10s">
            <RewindTenIcon size={30} />
          </button>
          <button
            key={playing ? 'pause' : 'play'}
            className="mobile-cluster-btn mobile-cluster-play"
            onClick={togglePlay}
            aria-label="Play/Pause"
          >
            {playing ? <MobilePauseIcon size={28} /> : <MobilePlayIcon size={28} />}
          </button>
          <button className="mobile-cluster-btn" onClick={() => skip(10)} aria-label="Forward 10s">
            <ForwardTenIcon size={30} />
          </button>
        </div>
      )}

      {ended && autoNextCountdown === null && !hasError && (
        <div className="video-ended-overlay">
          <button className="center-play-btn" onClick={replay} aria-label="Replay">
            <ReplayIcon />
          </button>
          <span className="video-ended-label">ចប់ហើយ — ចាក់ម្តងទៀត</span>
        </div>
      )}

      {autoNextCountdown !== null && (
        <div className="auto-next-overlay">
          <p className="auto-next-title">កំពុងចាក់​ Episode បន្ទាប់...</p>
          {nextTitle && <p className="auto-next-name">{nextTitle}</p>}
          <div className="auto-next-actions">
            <button className="auto-next-play-btn" onClick={() => onNext?.()}>
              ចាក់ឥឡូវ ({autoNextCountdown}s)
            </button>
            <button className="auto-next-cancel-btn" onClick={cancelAutoNext}>
              បោះបង់
            </button>
          </div>
        </div>
      )}

      <div className="video-controls">
        <div
          className={`seek-wrap ${isScrubbing ? 'is-scrubbing' : ''}`}
          ref={seekTrackRef}
          onMouseDown={handleSeekMouseDown}
          onTouchStart={handleSeekTouchStart}
          onMouseMove={(e) => !isScrubbing && handleScrubMove(e.clientX)}
          onMouseLeave={() => !isScrubbing && setHoverPreview(null)}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={current}
          tabIndex={-1}
        >
          {hoverPreview && (
            <div
              className="seek-tooltip"
              style={{ left: `${hoverPreview.pct}%` }}
            >
              {formatTime(hoverPreview.time)}
            </div>
          )}
          <div className="seek-track">
            <div className="seek-buffered" style={{ width: `${bufferedPct}%` }} />
            <div className="seek-played" style={{ width: `${progress}%` }} />
            <div className="seek-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-group controls-group-left">
            <button className="ctrl-btn mobile-hide-ctrl" onClick={togglePlay} aria-label="Play/Pause">
              {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
            </button>

            <button className="ctrl-btn mobile-hide-ctrl" onClick={() => skip(-10)} aria-label="Rewind 10s">
              <RewindIcon size={26} />
            </button>

            <button className="ctrl-btn mobile-hide-ctrl" onClick={() => skip(10)} aria-label="Forward 10s">
              <ForwardIcon size={26} />
            </button>

            <div className="volume-group">
              <button className="ctrl-btn" onClick={toggleMute} aria-label="Mute/Unmute">
                {volumeIcon}
              </button>
              <input
                className="volume-slider mobile-hide-ctrl"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                style={{ '--vol': `${(muted ? 0 : volume) * 100}%` }}
              />
            </div>

            <span className="time-label">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-group controls-group-right">
            {showSubtitleOption && (
              <button
                className={`subtitle-toggle-btn ${subtitleOn ? 'is-on' : 'is-off'}`}
                onClick={toggleSubtitle}
                aria-label={subtitleOn ? 'បិទ Subtitle' : 'បើក Subtitle'}
                aria-pressed={subtitleOn}
              >
                <ClosedCaptionIcon size={22} />
              </button>
            )}

            <div className="settings-menu-wrapper mobile-hide-ctrl">
              <button
                className={`ctrl-btn ${settingsOpen ? 'is-active' : ''}`}
                onClick={() => {
                  setSettingsOpen((v) => !v)
                  setSettingsView('root')
                  wake()
                }}
                aria-label="Settings"
                aria-expanded={settingsOpen}
              >
                <SettingsIcon />
              </button>

              {settingsOpen && (
                <div className="settings-menu">
                  {settingsView === 'root' && (
                    <>
                      <button className="settings-row" onClick={() => setSettingsView('speed')}>
                        <span>ល្បឿន</span>
                        <span className="settings-row-value">
                          {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                        </span>
                      </button>
                      {showSubtitleOption && (
                        <button className="settings-row" onClick={() => setSettingsView('subtitles')}>
                          <span>ស្រាប់អក្សរ</span>
                          <span className="settings-row-value">
                            {subtitleOn ? vttSubtitles[activeSubIndex]?.label : 'Off'}
                          </span>
                        </button>
                      )}
                    </>
                  )}

                  {settingsView === 'speed' && (
                    <>
                      <button className="settings-back" onClick={() => setSettingsView('root')}>
                        ‹ ល្បឿន
                      </button>
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          className="settings-option"
                          onClick={() => changePlaybackRate(rate)}
                        >
                          {rate === playbackRate && <CheckIcon />}
                          <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {settingsView === 'subtitles' && (
                    <>
                      <button className="settings-back" onClick={() => setSettingsView('root')}>
                        ‹ ស្រាប់អក្សរ
                      </button>
                      <button
                        className="settings-option"
                        onClick={() => {
                          selectSubtitleOff()
                          setSettingsOpen(false)
                        }}
                      >
                        {!subtitleOn && <CheckIcon />}
                        <span>Off</span>
                      </button>
                      {vttSubtitles.map((sub, index) => (
                        <button
                          key={sub.url}
                          className="settings-option"
                          onClick={() => {
                            selectSubtitle(index)
                            setSettingsOpen(false)
                          }}
                        >
                          {subtitleOn && activeSubIndex === index && <CheckIcon />}
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {supportsPip && (
              <button
                className={`ctrl-btn mobile-hide-ctrl ${isPipActive ? 'is-active' : ''}`}
                onClick={togglePip}
                aria-label="Picture in Picture"
              >
                <PipIcon />
              </button>
            )}

            <button
              className="ctrl-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
