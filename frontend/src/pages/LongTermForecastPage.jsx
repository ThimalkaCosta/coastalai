import LTDashboard from './longterm/LTDashboard'
import './longterm/longterm.css'

export default function LongTermForecastPage({ activeTab }) {
  return (
    <div className="lt-forecast-wrapper">
      <LTDashboard activeTab={activeTab} />
    </div>
  )
}
