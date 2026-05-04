import os
import csv
import re
import pandas as pd
import numpy as np
import xml.etree.ElementTree as ET
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Paths
BASE_DIR = r"c:\Users\pasin\Documents\GitHub\coastalai"
KML_DIR = os.path.join(BASE_DIR, "data", "kml")
VAL_KML = os.path.join(BASE_DIR, "data", "validate kml", "052025.kml")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
FORECAST_CSV = os.path.join(OUTPUT_DIR, "forecast_data_2025.csv")

OUT_TXT = os.path.join(OUTPUT_DIR, "validation_2025_report.txt")
OUT_CSV = os.path.join(OUTPUT_DIR, "validation_2025_details.csv")
OUT_PLOT = os.path.join(OUTPUT_DIR, "validation_2025_overlay.png")

# 1. KML Reading Functions
def read_kml_shoreline(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    coordinates = []
    for elem in root.iter():
        if 'coordinates' in elem.tag:
            text = elem.text.strip()
            coords_list = text.split()
            for coord in coords_list:
                parts = coord.split(',')
                if len(parts) >= 2:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    coordinates.append([lon, lat])
            if coordinates:
                break
    return coordinates

def parse_kml_date(filename):
    match = re.search(r'(\d{1,2})(\d{2})(\d{4})', filename)
    if match: return match.groups()
    match2 = re.search(r'(\d{1,2})(\d{4})', filename)
    if match2: return match2.groups()
    return None

def load_all_shorelines(kml_dir):
    import glob
    files = glob.glob(os.path.join(kml_dir, "*.kml"))
    data = []
    for f in files:
        if parse_kml_date(os.path.basename(f)):
            coords = read_kml_shoreline(f)
            if coords: data.append({'Coordinates': coords})
    return pd.DataFrame(data)

# 2. Geometry Functions
def create_baseline(all_coords):
    all_points = np.vstack(all_coords)
    X_lon = all_points[:, 0]
    y_lat = all_points[:, 1]
    if np.var(y_lat) > np.var(X_lon):
        reg = LinearRegression().fit(y_lat.reshape(-1, 1), X_lon)
        return reg.coef_[0], reg.intercept_, 'NS', y_lat.min(), y_lat.max()
    else:
        reg = LinearRegression().fit(X_lon.reshape(-1, 1), y_lat)
        return reg.coef_[0], reg.intercept_, 'EW', X_lon.min(), X_lon.max()

def generate_transects(slope, intercept, orientation, min_dim, max_dim, num_transects=163):
    dim_values = np.linspace(min_dim, max_dim, num_transects)
    transects = []
    if orientation == 'NS':
        normal_vec = np.array([1, -slope])
        normal_vec = normal_vec / np.linalg.norm(normal_vec)
        for lat in dim_values:
            lon_base = slope * lat + intercept
            transects.append({'origin': np.array([lon_base, lat]), 'vector': normal_vec})
    else:
        normal_vec = np.array([-slope, 1])
        normal_vec = normal_vec / np.linalg.norm(normal_vec)
        for lon in dim_values:
            lat_base = slope * lon + intercept
            transects.append({'origin': np.array([lon, lat_base]), 'vector': normal_vec})
    return transects

def get_intersection_distance(transect, shoreline_coords):
    origin = transect['origin']
    vec = transect['vector']
    shoreline_arr = np.array(shoreline_coords)
    d_vecs = shoreline_arr - origin
    cross_products = vec[0] * d_vecs[:, 1] - vec[1] * d_vecs[:, 0]
    mask = np.abs(cross_products) < 1e-4 
    candidates = shoreline_arr[mask]
    if len(candidates) == 0:
        closest_idx = np.argmin(np.abs(cross_products))
        candidates = shoreline_arr[closest_idx:closest_idx+1]
    candidate_d_vecs = candidates - origin
    distances = candidate_d_vecs[:, 0] * vec[0] + candidate_d_vecs[:, 1] * vec[1]
    return np.mean(distances)

def segment_label(idx, total, n_segs=5):
    labels = ["North", "Upper-Middle", "Middle", "Lower-Middle", "South"]
    seg = int(idx / (total / n_segs))
    return labels[min(seg, n_segs - 1)]

# Main script
def main():
    print("Loading historical shorelines for baseline...")
    shorelines_df = load_all_shorelines(KML_DIR)
    all_coords = shorelines_df['Coordinates'].tolist()
    
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    num_t = 163
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects=num_t)
    
    print("Loading forecasted data for 2025...")
    if not os.path.exists(FORECAST_CSV):
        print(f"Error: Forecast data not found at {FORECAST_CSV}. Did you run the 2025 forecast from the frontend?")
        return
        
    forecast_df = pd.read_csv(FORECAST_CSV)
    forecast_row = forecast_df.iloc[-1]
    transect_cols = [c for c in forecast_df.columns if c.startswith('Transect_')]
    
    forecast_dists = [forecast_row[c] for c in transect_cols]
    
    print(f"Loading actual validation KML: {VAL_KML}")
    val_coords = read_kml_shoreline(VAL_KML)
    
    val_dists = []
    for tr in transects:
        dist = get_intersection_distance(tr, val_coords)
        val_dists.append(dist)
        
    forecast_dists = np.array(forecast_dists)
    val_dists = np.array(val_dists)
    
    # Calculate Metrics in meters
    METERS_PER_DEG = 111000
    
    diff_deg = val_dists - forecast_dists
    diff_m = diff_deg * METERS_PER_DEG
    abs_diff_m = np.abs(diff_m)
    
    # Global Metrics
    rmse_m = np.sqrt(mean_squared_error(val_dists * METERS_PER_DEG, forecast_dists * METERS_PER_DEG))
    mae_m = mean_absolute_error(val_dists * METERS_PER_DEG, forecast_dists * METERS_PER_DEG)
    r2 = r2_score(val_dists, forecast_dists)
    
    max_err = abs_diff_m.max()
    min_err = abs_diff_m.min()
    median_err = np.median(abs_diff_m)
    
    acc_5m = np.mean(abs_diff_m <= 5.0) * 100
    acc_10m = np.mean(abs_diff_m <= 10.0) * 100
    
    if mae_m <= 5:
        grade = "EXCELLENT"
    elif mae_m <= 10:
        grade = "GOOD"
    elif mae_m <= 20:
        grade = "MODERATE"
    else:
        grade = "POOR"
        
    # Segment breakdown
    seg_data = {}
    for i, d in enumerate(abs_diff_m):
        seg_data.setdefault(segment_label(i, num_t), []).append(d)
        
    # Build report string
    lines = []
    lines.append("=" * 60)
    lines.append("   2025 SHORELINE FORECAST — VALIDATION REPORT")
    lines.append("=" * 60)
    lines.append(f"  Forecast Data : {os.path.basename(FORECAST_CSV)}")
    lines.append(f"  Observed KML  : {os.path.basename(VAL_KML)}")
    lines.append(f"  Transects evaluated : {num_t}")
    lines.append("")
    lines.append("-- GLOBAL METRICS --------------------------------------")
    lines.append(f"  RMSE          : {rmse_m:.2f} m")
    lines.append(f"  MAE           : {mae_m:.2f} m")
    lines.append(f"  R2 Score      : {r2:.4f}")
    lines.append(f"  Median Error  : {median_err:.2f} m")
    lines.append(f"  Min Error     : {min_err:.2f} m")
    lines.append(f"  Max Error     : {max_err:.2f} m")
    lines.append(f"  Within  5 m   : {acc_5m:.1f}%")
    lines.append(f"  Within 10 m   : {acc_10m:.1f}%")
    lines.append("")
    lines.append("-- ACCURACY GRADE --------------------------------------")
    lines.append(f"  Grade         : {grade}  (MAE = {mae_m:.2f} m)")
    lines.append("")
    lines.append("-- SEGMENT BREAKDOWN -----------------------------------")
    lines.append(f"  {'Segment':<18} {'MAE (m)':>8} {'RMSE (m)':>9} {'Max (m)':>8}")
    lines.append(f"  {'-'*18} {'-'*8} {'-'*9} {'-'*8}")
    for lbl in ["North", "Upper-Middle", "Middle", "Lower-Middle", "South"]:
        ds = np.array(seg_data.get(lbl, [0]))
        lines.append(
            f"  {lbl:<18} {np.mean(ds):>8.2f} "
            f"{np.sqrt(np.mean(ds**2)):>9.2f} {ds.max():>8.2f}"
        )
    lines.append("=" * 60)

    report = "\n".join(lines)
    print(report)

    # Save TXT
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUT_TXT, "w", encoding="utf-8") as f:
        f.write(report + "\n")
    print(f"\nReport saved  -> {OUT_TXT}")

    # Save CSV
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Transect_Index", "Region", "Forecast_Dist_m", "Actual_Dist_m", "Abs_Error_m"])
        for i, (fore, act, err) in enumerate(zip(forecast_dists * METERS_PER_DEG, val_dists * METERS_PER_DEG, abs_diff_m)):
            writer.writerow([i+1, segment_label(i, num_t), round(fore, 3), round(act, 3), round(err, 3)])
    print(f"Per-transect CSV -> {OUT_CSV}")

    # Generate Plot
    print("\nGenerating visualization...")
    val_pts = []
    for i, dist in enumerate(val_dists):
        tr = transects[i]
        val_pts.append(tr['origin'] + tr['vector'] * dist)
    val_pts = np.array(val_pts)
    
    fore_pts = []
    for i, dist in enumerate(forecast_dists):
        tr = transects[i]
        fore_pts.append(tr['origin'] + tr['vector'] * dist)
    fore_pts = np.array(fore_pts)
    
    plt.figure(figsize=(10, 10))
    plt.plot(val_pts[:, 0], val_pts[:, 1], 'b-', linewidth=2, label='Actual 2025 Shoreline (Validation)')
    plt.plot(fore_pts[:, 0], fore_pts[:, 1], 'r--', linewidth=2, label='Forecasted 2025 Shoreline')
    
    for i in range(len(val_pts) - 1):
        poly_pts = np.array([val_pts[i], val_pts[i+1], fore_pts[i+1], fore_pts[i]])
        plt.fill(poly_pts[:,0], poly_pts[:,1], color='gray', alpha=0.3, edgecolor=None)
        
    plt.title(f"Validation: Forecast vs Actual 2025 Shoreline\nRMSE: {rmse_m:.2f}m | MAE: {mae_m:.2f}m | Grade: {grade}")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.axis('equal')
    plt.legend()
    plt.grid(True, linestyle=':')
    
    plt.savefig(OUT_PLOT, dpi=150)
    print(f"Saved validation map to: {OUT_PLOT}")
    
if __name__ == "__main__":
    main()
