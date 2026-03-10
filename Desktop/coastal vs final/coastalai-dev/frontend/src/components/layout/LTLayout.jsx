import Navbar from './Navbar'
import LTSidebar from './LTSidebar'

export default function LTLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 pt-[72px] sm:pt-[80px]">
                <LTSidebar />
                {/* We add lt-forecast-wrapper here to match previous styles, and lg:ml-[272px] to avoid overlapping the sidebar */}
                <main className="flex-1 lg:ml-[272px] transition-all duration-300 min-h-[calc(100vh-80px)] lt-forecast-wrapper">
                    {children}
                </main>
            </div>
        </div>
    )
}
