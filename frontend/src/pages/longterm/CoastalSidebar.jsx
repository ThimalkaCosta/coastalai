export default function CoastalSidebar({
    data,
    activeDistrict,
    activeSegment,
    currentYear,
    yearStats,
    showInfra,
    infraLoading,
    infraResults,
    onDistrictClick,
    onInfraToggle,
    onBackToNational,
}) {
    if (!data) return null

    const transects = data.transects || []
    const stableCount = transects.filter(t => t.vulnerabilityLevel === 'stable').length
    const moderateCount = transects.filter(t => t.vulnerabilityLevel === 'moderate').length
    const criticalCount = transects.filter(t => t.vulnerabilityLevel === 'critical').length
    const isForecast = currentYear >= 2026
    const yearLabel = currentYear || '—'

    /* ── National view ── */
    if (!activeDistrict) {
        return (
            <aside className="cew-sidebar">
                <div className="cew-sb-section">
                    <div className="cew-sb-title">Coastal Districts</div>
                    <div className="cew-district-list">
                        {data.districts.map(d => (
                            <div
                                key={d.id}
                                className={`cew-district-item ${d.hasData ? 'active' : 'inactive'}`}
                                onClick={() => onDistrictClick(d)}
                            >
                                <span className="cew-district-dot" style={{ background: d.color }} />
                                <span className="cew-district-name">{d.name}</span>
                                <span className={`cew-district-tag ${d.hasData ? 'has-data' : 'no-data'}`}>
                                    {d.hasData ? 'Active' : 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cew-sb-section">
                    <div className="cew-sb-title">System Status</div>
                    <div className="cew-stat-grid">
                        {[
                            { label: 'Observations', value: '32', unit: 'kml', sub: '2010 – 2025', cls: 'cew-teal' },
                            { label: 'Districts', value: '1', unit: '/12', sub: 'Monitored', cls: 'cew-blue' },
                            { label: 'Model R²', value: '0.83', unit: '', sub: 'Ensemble', cls: 'cew-green' },
                            { label: 'RMSE', value: '6.75', unit: 'm', sub: 'Accuracy', cls: 'cew-yellow' },
                        ].map(s => (
                            <div key={s.label} className="cew-stat-card">
                                <div className="cew-stat-label">{s.label}</div>
                                <div className={`cew-stat-value ${s.cls}`}>{s.value}<span className="cew-stat-unit">{s.unit}</span></div>
                                <div className="cew-stat-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cew-sb-section">
                    <div className="cew-sb-title">Vulnerability Legend</div>
                    <div className="cew-vuln-legend">
                        {[
                            { color: '#ef4444', label: 'Critical', desc: '> 5 m/yr erosion', cls: 'cew-red' },
                            { color: '#f59e0b', label: 'Moderate', desc: '0–5 m/yr erosion', cls: 'cew-yellow' },
                            { color: '#10b981', label: 'Stable', desc: 'Accretion or stable', cls: 'cew-green' },
                        ].map(v => (
                            <div key={v.label} className="cew-vuln-row">
                                <span className="cew-vuln-dot" style={{ background: v.color }} />
                                <div>
                                    <div className={`cew-vuln-label ${v.cls}`}>{v.label}</div>
                                    <div className="cew-vuln-desc">{v.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cew-sb-hint">
                    Click a district with <span className="cew-teal">Active</span> status to drill into segment analysis.
                    Use the <strong>Time Machine</strong> slider to animate shoreline change 2010 → 2030.
                    Forecast years <span className="cew-yellow">2026★ – 2030</span> load <em>real AI predictions</em>.
                </div>
            </aside>
        )
    }

    /* ── No segment ── */
    if (!activeSegment) {
        return (
            <aside className="cew-sidebar">
                <div className="cew-sb-section">
                    <button className="cew-back-btn" onClick={onBackToNational}>← National View</button>
                    <div className="cew-seg-title" style={{ marginTop: 12 }}>{activeDistrict.name} District</div>
                    <div className="cew-seg-desc">No segment data available yet.</div>
                </div>
            </aside>
        )
    }

    const seg = activeSegment
    const vulnCls = { critical: 'cew-badge-critical', moderate: 'cew-badge-moderate', stable: 'cew-badge-stable' }[seg.overallVulnerability] || 'cew-badge-stable'
    const vulnLabel = { critical: 'Critical 🔴', moderate: 'Moderate 🟡', stable: 'Stable 🟢' }[seg.overallVulnerability] || seg.overallVulnerability

    // For forecast years use backend summary, else use segment static values
    const landLossHa = isForecast && yearStats?.summary
        ? (yearStats.summary.totalLossM2 / 10000).toFixed(3)
        : (seg.landChange2029.totalLoss_m2 / 10000).toFixed(3)

    const erosionCount = isForecast && yearStats?.summary
        ? yearStats.summary.erosionSegments
        : seg.landChange2029.erosionSegments

    const totalCount = isForecast && yearStats?.summary
        ? yearStats.summary.totalSegments
        : seg.landChange2029.totalSegments

    return (
        <aside className="cew-sidebar">
            {/* Identity + back */}
            <div className="cew-sb-section" style={{ paddingBottom: 10 }}>
                <button className="cew-back-btn" onClick={onBackToNational}>← National View</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span className="cew-seg-badge">{seg.segmentNo || 'KL-01'}</span>
                    <span className={`cew-vuln-badge ${vulnCls}`}>{vulnLabel}</span>
                    {isForecast && (
                        <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 'auto', fontWeight: 700 }}>
                            🤖 {yearLabel}
                        </span>
                    )}
                </div>
                <div className="cew-seg-title" style={{ marginTop: 6 }}>{seg.name}</div>
                <div className="cew-seg-desc">
                    {seg.district} District · {isForecast ? `AI Forecast for ${yearLabel}` : 'Observed baseline'}
                </div>
            </div>

            {/* Erosion stats */}
            <div className="cew-sb-section">
                <div className="cew-sb-title">
                    Erosion Statistics
                    {isForecast && <span style={{ color: '#f59e0b', fontStyle: 'normal', marginLeft: 4 }}>{yearLabel}</span>}
                </div>
                <div className="cew-stat-grid">
                    <div className="cew-stat-card">
                        <div className="cew-stat-label">Avg EPR</div>
                        <div className="cew-stat-value cew-yellow">{seg.avgEPR}<span className="cew-stat-unit">m/yr</span></div>
                        <div className="cew-stat-sub">End Point Rate</div>
                    </div>
                    <div className="cew-stat-card">
                        <div className="cew-stat-label">Net NSM</div>
                        <div className="cew-stat-value cew-yellow">{seg.avgNSM}<span className="cew-stat-unit">m</span></div>
                        <div className="cew-stat-sub">Net Shoreline Move</div>
                    </div>
                    <div className="cew-stat-card">
                        <div className="cew-stat-label">Land Loss</div>
                        <div className="cew-stat-value cew-red">{landLossHa}<span className="cew-stat-unit">ha</span></div>
                        <div className="cew-stat-sub">By {yearLabel}</div>
                    </div>
                    <div className="cew-stat-card">
                        <div className="cew-stat-label">Erosion</div>
                        <div className="cew-stat-value cew-red">{erosionCount}<span className="cew-stat-unit">/{totalCount}</span></div>
                        <div className="cew-stat-sub">Transects</div>
                    </div>
                </div>
            </div>

            {/* Model accuracy */}
            <div className="cew-sb-section">
                <div className="cew-sb-title">Model Accuracy ({seg.modelAccuracy?.model || 'Ensemble'})</div>
                <div className="cew-accuracy">
                    {[
                        { label: 'R²', pct: (seg.modelAccuracy?.r2 ?? 0.8317) * 100, val: seg.modelAccuracy?.r2 ?? 0.8317, cls: 'cew-teal' },
                        { label: 'Accuracy', pct: 87, val: '87%', cls: 'cew-teal' },
                        { label: 'RMSE', pct: Math.min(100, (seg.modelAccuracy?.rmse ?? 6.75) * 5), val: `${seg.modelAccuracy?.rmse ?? 6.75}m`, cls: 'cew-yellow', danger: true },
                    ].map(b => (
                        <div key={b.label} className="cew-acc-row">
                            <span className="cew-acc-label">{b.label}</span>
                            <div className="cew-acc-track">
                                <div className="cew-acc-fill" style={{
                                    width: `${b.pct}%`,
                                    background: b.danger ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : undefined
                                }} />
                            </div>
                            <span className={`cew-acc-val ${b.cls}`}>{b.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transect summary — reacts to real transect data */}
            <div className="cew-sb-section">
                <div className="cew-sb-title">Transect Summary — {yearLabel}</div>
                <div className="cew-vuln-legend">
                    {[
                        { label: 'Critical', count: criticalCount, color: '#ef4444', cls: 'cew-red' },
                        { label: 'Moderate', count: moderateCount, color: '#f59e0b', cls: 'cew-yellow' },
                        { label: 'Stable', count: stableCount, color: '#10b981', cls: 'cew-green' },
                    ].map(v => (
                        <div key={v.label} className="cew-vuln-row">
                            <span className="cew-vuln-dot" style={{ background: v.color }} />
                            <div className={`cew-vuln-label ${v.cls}`}>{v.label}</div>
                            <span className="cew-vuln-count">{v.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Infrastructure at risk */}
            <div className="cew-sb-section">
                <div className="cew-sb-title">Infrastructure at Risk</div>
                <div className="cew-toggle-row">
                    <div>
                        <div className="cew-toggle-label">Show At-Risk Structures</div>
                        <div className="cew-toggle-desc">Buildings, roads, railway lines in risk zone</div>
                    </div>
                    <div className={`cew-toggle ${showInfra ? 'on' : ''}`} onClick={onInfraToggle}>
                        <div className="cew-toggle-thumb" />
                    </div>
                </div>
                {infraLoading && <div className="cew-infra-loading">⏳ Querying OpenStreetMap…</div>}
                {infraResults && showInfra && (
                    <div className="cew-infra-result">
                        <div className="cew-infra-title">⚠️ Structures at Risk by {yearLabel}</div>
                        <div className="cew-infra-row">Buildings <span>{infraResults.buildings}</span></div>
                        <div className="cew-infra-row">Hotels / Guesthouses <span>{infraResults.hotels}</span></div>
                        <div className="cew-infra-row">Road segments <span>{infraResults.roads}</span></div>
                        <div className="cew-infra-row">Railway line <span>{infraResults.railway ? 'YES ⚠️' : 'No'}</span></div>
                        <div className="cew-infra-divider" />
                        <div className="cew-infra-row" style={{ fontWeight: 700 }}>Total at risk <span>{infraResults.totalAtRisk}</span></div>
                    </div>
                )}
            </div>
        </aside>
    )
}
