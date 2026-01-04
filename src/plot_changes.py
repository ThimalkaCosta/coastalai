import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
from data_loader import load_all_shorelines, read_kml_shoreline
from preprocessing import create_baseline, generate_transects, get_intersection_distance

def plot_changes_overlay_specific():
    base_dir = r"e:\coastal"
    data_dir = os.path.join(base_dir, "data", "high_res_kml")
    output_dir = os.path.join(base_dir, "output")
    
    # User requested reference file
    user_ref_kml = os.path.join(data_dir, "SWnew 2282025.kml")
    
    # 1. Load Data for Transect Definition (using all files for stable baseline)
    print("Loading original shorelines to re-create transect geometry...")
    shorelines_df = load_all_shorelines(data_dir)
    all_coords = shorelines_df['Coordinates'].tolist()
    
    # 2. Re-create Baseline
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects=50)
    
    # 3. Load Forecast
    print("Loading forecast...")
    forecast_path = os.path.join(output_dir, "forecast_5_years.csv")
    forecast_df = pd.read_csv(forecast_path)
    final_forecast = forecast_df.iloc[-1] # 2030
    
    # 4. Load SPECIFIC User Reference KML
    # We must calculate its distances to the transects
    print(f"Loading reference KML: {user_ref_kml}")
    ref_coords = read_kml_shoreline(user_ref_kml)
    
    # Calculate transect distances for this reference
    ref_distances = []
    for tr in transects:
        dist = get_intersection_distance(tr, ref_coords)
        ref_distances.append(dist)
        
    transect_cols = [c for c in forecast_df.columns if c.startswith('Transect_')]
    
    # 5. Reconstruct Points
    ref_pts = []
    forecast_pts = []
    
    valid_indices = []
    
    for i, col in enumerate(transect_cols):
        idx = int(col.split('_')[1])
        tr = transects[idx]
        
        d_ref = ref_distances[idx]
        d_fore = final_forecast[col]
        
        if np.isnan(d_ref) or np.isnan(d_fore):
            continue
            
        valid_indices.append(idx)
        
        p_ref = tr['origin'] + tr['vector'] * d_ref
        p_fore = tr['origin'] + tr['vector'] * d_fore
        
        ref_pts.append(p_ref)
        forecast_pts.append(p_fore)
        
    ref_pts = np.array(ref_pts)
    forecast_pts = np.array(forecast_pts)
    
    # 6. Plotting
    plt.figure(figsize=(10, 10))
    
    # Reference (Blue)
    plt.plot(ref_pts[:,0], ref_pts[:,1], 'b-', linewidth=2, label='Current (2/28/2025)')
    
    # Forecast (Red dashed)
    plt.plot(forecast_pts[:,0], forecast_pts[:,1], 'r--', linewidth=2, label='Forecast (2030)')
    
    # Fills
    for i in range(len(ref_pts) - 1):
        d_ref = ref_distances[valid_indices[i]]
        d_fore = final_forecast[transect_cols[valid_indices[i]]]
        
        change = d_fore - d_ref
        # Logic: Forecast > Ref => Accretion (assuming normal points to sea)
        # Visual check: Green for accretion, Red for erosion
        color = 'lightgreen' if change > 0 else 'salmon'
        
        poly_pts = np.array([
            ref_pts[i],
            ref_pts[i+1],
            forecast_pts[i+1],
            forecast_pts[i]
        ])
        
        plt.fill(poly_pts[:,0], poly_pts[:,1], color=color, alpha=0.5, edgecolor=None)
        
    plt.title("Shoreline Forecast vs User Reference (Feb 2025)")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.axis('equal')
    plt.legend()
    plt.grid(True, linestyle=':')
    
    out_file = os.path.join(output_dir, "shoreline_map_ref_2282025.png")
    plt.savefig(out_file, dpi=150)
    print(f"Map saved to {out_file}")
    plt.close()

if __name__ == "__main__":
    plot_changes_overlay_specific()
