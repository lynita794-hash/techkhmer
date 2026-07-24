import './DramaCardSkeleton.css'

// Placeholder card shown while dramas are still loading — matches the
// poster + title layout of DramaCard so the page doesn't jump/reflow once
// real data arrives.
function DramaCardSkeleton() {
  return (
    <div className="drama-card-skeleton">
      <div className="skeleton-poster" />
      <div className="skeleton-title" />
    </div>
  )
}

export default DramaCardSkeleton
