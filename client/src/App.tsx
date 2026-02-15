import { Routes, Route, useLocation, useSearchParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Latest from './pages/Latest'
import About from './pages/About'

export default function App() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isHomeLanding = location.pathname === '/' && !searchParams.get('q')

  return (
    <div className="min-h-screen flex flex-col">
      {!isHomeLanding && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
