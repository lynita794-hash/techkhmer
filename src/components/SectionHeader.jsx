import './SectionHeader.css'

function SectionHeader({ title }) {
  return (
    <div className="section-header">
      <span className="section-bar" />
      <h2>{title}</h2>
    </div>
  )
}

export default SectionHeader
