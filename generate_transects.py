"""
generate_transects.py
Reads the latest analysis CSV (23-24-stat.csv) and injects 163 coloured
transects into frontend/public/data/dashboard_data.json.

Vulnerability classification (based on EPR m/yr):
  EPR <= -5   -> critical  (#ef4444 red)
  EPR <  0    -> moderate  (#f59e0b amber)
  EPR >= 0    -> stable    (#10b981 green)
"""

import csv, json, os

BASE   = os.path.dirname(os.path.abspath(__file__))
CSV    = os.path.join(BASE, "data", "analysis", "23-24-stat.csv")
JSON   = os.path.join(BASE, "frontend", "public", "data", "dashboard_data.json")

def classify(epr):
    if epr <= -5:
        return "critical", "#ef4444"
    elif epr < 0:
        return "moderate", "#f59e0b"
    else:
        return "stable",   "#10b981"

def trend_label(epr_trend):
    if epr_trend == "eroding":   return "Erosion"
    if epr_trend == "accreting": return "Accretion"
    return "Stable"

# ── Read CSV ──────────────────────────────────────────────────────────────
transects = []
with open(CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        tid  = int(row["id"])
        sce  = float(row["SCE"])
        nsm  = float(row["NSM"])
        epr  = float(row["EPR"])
        lrr  = epr          # EPR and LRR same for 1-year period
        epr_trend = row["EPR_trend"].strip()

        vuln, color = classify(epr)

        transects.append({
            "id":               tid,
            "epr":              round(epr, 2),
            "nsm":              round(nsm, 2),
            "sce":              round(sce, 2),
            "lrr":              round(lrr, 2),
            "vulnerabilityLevel": vuln,
            "color":            color,
            "trend":            trend_label(epr_trend)
        })

print(f"Generated {len(transects)} transects from {os.path.basename(CSV)}")

# Count categories
critical = sum(1 for t in transects if t["vulnerabilityLevel"] == "critical")
moderate = sum(1 for t in transects if t["vulnerabilityLevel"] == "moderate")
stable   = sum(1 for t in transects if t["vulnerabilityLevel"] == "stable")
print(f"  Critical (red)   : {critical}")
print(f"  Moderate (amber) : {moderate}")
print(f"  Stable   (green) : {stable}")

# ── Inject into dashboard_data.json ──────────────────────────────────────
with open(JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

data["transects"] = transects

# Also update segment stats with real numbers
if data.get("segments"):
    seg = data["segments"][0]
    seg["numTransects"] = len(transects)
    seg["landChange2029"]["erosionSegments"] = critical + moderate
    seg["landChange2029"]["accrSegments"]    = stable
    seg["landChange2029"]["totalSegments"]   = len(transects)
    # avgEPR from all transects
    avg_epr = sum(t["epr"] for t in transects) / len(transects)
    seg["avgEPR"] = round(avg_epr, 2)
    seg["avgNSM"] = round(sum(t["nsm"] for t in transects) / len(transects), 2)
    if critical / len(transects) > 0.3:
        seg["overallVulnerability"] = "critical"
    elif (critical + moderate) / len(transects) > 0.4:
        seg["overallVulnerability"] = "moderate"
    else:
        seg["overallVulnerability"] = "stable"

with open(JSON, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print(f"\nInjected into {JSON}")
print("Done! Refresh the browser to see coloured transects.")
