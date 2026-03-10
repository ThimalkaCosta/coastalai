import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths (Vite asset handling)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const DISTRICT_MARKERS = {
    kalutara: { center: [6.585, 80.21], name: 'Kalutara' },
    galle: { center: [6.033, 80.216], name: 'Galle' },
    matara: { center: [5.944, 80.535], name: 'Matara' },
    hambantota: { center: [6.124, 81.107], name: 'Hambantota' },
    colombo: { center: [6.927, 79.861], name: 'Colombo' },
    gampaha: { center: [7.091, 79.999], name: 'Gampaha' },
    puttalam: { center: [8.031, 79.845], name: 'Puttalam' },
    mannar: { center: [8.977, 79.904], name: 'Mannar' },
    jaffna: { center: [9.661, 80.025], name: 'Jaffna' },
    trincomalee: { center: [8.578, 81.234], name: 'Trincomalee' },
    batticaloa: { center: [7.717, 81.700], name: 'Batticaloa' },
    ampara: { center: [7.301, 81.672], name: 'Ampara' },
}

function generateTransectPositions(count) {
    const startLat = 6.3678, endLat = 6.3572
    const startLon = 80.0109, endLon = 80.0163
    return Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1)
        return [startLat + (endLat - startLat) * t, startLon + (endLon - startLon) * t]
    })
}

function parseKMLCoords(kmlText) {
    const match = kmlText.match(/<coordinates>([\s\S]*?)<\/coordinates>/)
    if (!match) return []
    return match[1].trim().split(/\s+/).map(pt => {
        const [lng, lat] = pt.split(',').map(Number)
        return [lat, lng]
    }).filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
}

export default function CoastalMapView({
    data,
    activeDistrict,
    activeSegment,
    currentYear,
    currentKMLPath,
    showInfra,
    infraResults,
    onDistrictClick,
}) {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const distMarkersRef = useRef([])
    const transectMarkersRef = useRef([])
    const kmlLayerRef = useRef(null)
    const infraLayerRef = useRef(null)
    const initializedRef = useRef(false)

    // Init map once
    useEffect(() => {
        if (!containerRef.current || initializedRef.current) return
        initializedRef.current = true

        const map = L.map(containerRef.current, {
            center: [7.8731, 80.7718],
            zoom: 7,
            zoomControl: false,
        })

        L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)
        L.control.zoom({ position: 'topright' }).addTo(map)
        mapRef.current = map
    }, [])

    // Draw district markers
    useEffect(() => {
        const map = mapRef.current
        if (!map || !data) return

        distMarkersRef.current.forEach(l => map.removeLayer(l))
        distMarkersRef.current = []

        if (activeDistrict) return // hide in segment view

        data.districts.forEach(district => {
            const cfg = DISTRICT_MARKERS[district.id]
            if (!cfg) return

            const circle = L.circle(cfg.center, {
                radius: district.hasData ? 28000 : 22000,
                color: district.color,
                fillColor: district.color,
                fillOpacity: district.hasData ? 0.30 : 0.07,
                weight: district.hasData ? 2 : 1,
            }).addTo(map)

            const label = L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'cew-district-label',
                offset: [0, 0],
            })
                .setContent(
                    `<div style="font-size:10px;font-weight:700;color:${district.hasData ? district.color : '#6b7280'};background:transparent;border:none;box-shadow:none;text-align:center;">
            ${district.name}${district.hasData ? '<br/><span style="font-size:9px;color:#14b8a6">● Active</span>' : ''}
          </div>`
                )
                .setLatLng(cfg.center)

            map.addLayer(label)

            if (district.hasData) {
                circle.on('click', () => onDistrictClick(district))
            }

            distMarkersRef.current.push(circle, label)
        })

        map.setView([7.5, 80.7], 7)
    }, [activeDistrict, data, onDistrictClick])

    // Draw transect dots in segment view
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        transectMarkersRef.current.forEach(l => map.removeLayer(l))
        transectMarkersRef.current = []

        if (!activeSegment || !data) return

        const positions = generateTransectPositions(data.transects.length)

        data.transects.forEach((t, i) => {
            const pos = positions[i]
            if (!pos) return

            const dot = L.circleMarker(pos, {
                radius: 7,
                color: t.color,
                fillColor: t.color,
                fillOpacity: 0.85,
                weight: 2,
            }).addTo(map)

            dot.bindPopup(`
        <div class="cew-popup">
          <div class="cew-popup-title">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color}"></span>
            Transect #${t.id}
          </div>
          <div class="cew-popup-row"><span>Vulnerability</span><span style="color:${t.color}">${t.vulnerabilityLevel.toUpperCase()}</span></div>
          <div class="cew-popup-row"><span>EPR</span><span>${t.epr} m/yr</span></div>
          <div class="cew-popup-row"><span>NSM</span><span>${t.nsm} m</span></div>
          <div class="cew-popup-row"><span>SCE</span><span>${t.sce} m</span></div>
          <div class="cew-popup-row"><span>LRR</span><span>${t.lrr} m/yr</span></div>
          <div class="cew-popup-row"><span>Trend</span><span>${t.trend}</span></div>
        </div>
      `)

            transectMarkersRef.current.push(dot)
        })

        map.flyTo(activeSegment.center, activeSegment.zoom, { duration: 1.2 })
    }, [activeSegment, data, data?.transects])

    // Swap KML layer when year changes
    useEffect(() => {
        const map = mapRef.current
        if (!map || !currentKMLPath || !activeSegment) return

        if (kmlLayerRef.current) {
            map.removeLayer(kmlLayerRef.current)
            kmlLayerRef.current = null
        }

        const isForecasted = currentKMLPath.includes('forecast')
        const color = isForecasted ? '#f59e0b' : '#14b8a6'

        fetch(currentKMLPath)
            .then(r => r.text())
            .then(text => {
                const coords = parseKMLCoords(text)
                if (!coords.length) return
                const line = L.polyline(coords, {
                    color,
                    weight: isForecasted ? 3 : 2,
                    opacity: 0.9,
                    dashArray: isForecasted ? '8 4' : undefined,
                }).addTo(map)
                kmlLayerRef.current = line
            })
            .catch(() => { })
    }, [currentKMLPath, activeSegment])

    // Infrastructure overlay
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        if (infraLayerRef.current) {
            map.removeLayer(infraLayerRef.current)
            infraLayerRef.current = null
        }

        if (!showInfra || !activeSegment || !infraResults) return

        const group = L.layerGroup().addTo(map)
        const [[south, west], [north, east]] = activeSegment.bbox

        const riskZone = L.rectangle([[south, west], [north, east]], {
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6 3',
        })
        group.addLayer(riskZone)

        const buildingPositions = [
            [6.3620, 80.0125], [6.3635, 80.0130], [6.3650, 80.0118],
            [6.3665, 80.0122], [6.3642, 80.0140], [6.3608, 80.0115],
        ]
        buildingPositions.forEach(pos => {
            const m = L.circleMarker(pos, {
                radius: 6,
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: 0.75,
                weight: 2,
            })
            m.bindTooltip('⚠️ Structure at Risk')
            group.addLayer(m)
        })

        infraLayerRef.current = group
    }, [showInfra, infraResults, activeSegment])

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
