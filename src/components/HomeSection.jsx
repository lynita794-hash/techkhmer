import { Link } from 'react-router-dom'
import DramaGrid from './DramaGrid'
import DramaSlider from './DramaSlider'
import './HomeSection.css'

// A titled row of dramas on the homepage (e.g. "MOVIE »", "TVSHOW »").
// Clicking the title/arrow navigates to the full filtered listing. When
// `slider` is true, renders as a horizontal scrollable carousel with
// prev/next arrows instead of a static wrapping grid.
function HomeSection({
  title,
  dramas,
  moreHref,
  slider,
  autoPlay,
  autoPlaySpeed,
  loading = false,
}) {
  if (!loading && dramas.length === 0) return null

  return (
    <section className="home-section">
      <div className="home-section-header">
        <Link to={moreHref} className="home-section-title-link">
          <h2>{title}</h2>
          <span className="home-section-arrow">»</span>
        </Link>
      </div>

      {loading ? (
        <DramaGrid dramas={[]} loading skeletonCount={slider ? 6 : 12} />
      ) : slider ? (
        <DramaSlider dramas={dramas} autoPlay={autoPlay} autoPlaySpeed={autoPlaySpeed} />
      ) : (
        <DramaGrid dramas={dramas} />
      )}
    </section>
  )
}

export default HomeSection
