import Navbar from './Navbar'
import MorphSidebar from './MorphSidebar'

export default function MorphLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-[72px] sm:pt-[80px]">
        <MorphSidebar />
        <main className="flex-1 lg:ml-[272px] transition-all duration-300 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
