import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './StaticPage.css'

function StaticPage({ title, children }) {
  return (
    <>
      <Navbar search="" onSearchChange={() => {}} />

      <main className="static-page">
        <h1>{title}</h1>
        <div className="static-content">{children}</div>
      </main>

      <Footer />
    </>
  )
}

export default StaticPage
