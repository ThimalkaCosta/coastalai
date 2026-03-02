import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-[72px] sm:pt-[80px]">
        <Sidebar />
        <main className="flex-1 lg:ml-[272px] transition-all duration-300 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
