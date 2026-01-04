import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import datetime
from src.data_loader import load_all_shorelines, load_transect_stats
from src.preprocessing import create_baseline, generate_transects, get_intersection_distance
from src.forecasting import train_and_predict
from src.visualization import plot_transect_history

def interactive_main():
    print("--- Coastal Erosion Interactive Forecast ---")
    try:
        target_year = int(input("Enter the target year for forecast (e.g., 2028): "))
    except ValueError:
        print("Invalid year. Please enter a number.")
        return

    base_dir = r"e:\coastal\data"
    kml_dir = os.path.join(base_dir, "high_res_kml")
    output_dir = r"e:\coastal_vs\output"
    
    print("1. Loading Data & Training Model...")
    shorelines_df = load_all_shorelines(kml_dir)
    
    # Process Transects
    all_coords = shorelines_df['Coordinates'].tolist()
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects=50)
    
    results = []
    for _, row in shorelines_df.iterrows():
        date = row['Date']
        coords = row['Coordinates']
        row_data = {'Date': date}
        for i, tr in enumerate(transects):
            dist = get_intersection_distance(tr, coords)
            row_data[f'Transect_{i}'] = dist
        results.append(row_data)
    
    history_df = pd.DataFrame(results).sort_values('Date')
    transect_cols = [c for c in history_df.columns if c.startswith('Transect_')]
    
    # Determine years ahead
    latest_date = history_df['Date'].max()
    years_ahead = target_year - latest_date.year
    
    if years_ahead <= 0:
        print(f"Target year {target_year} must be in the future (after {latest_date.year}).")
        return
        
    print(f"Forecasting {years_ahead} years ahead to {target_year}...")
    
    # Train & Predict
    # train_and_predict returns annual, we just need the row for target year
    # But train_and_predict logic loops. Let's reuse it but filter result.
    future_df, models = train_and_predict(history_df, transect_cols, years_ahead=years_ahead)
    
    # Create a proper future dataframe for plotting
    # We have future_df from train_and_predict which contains annual steps up to target
    # So we can pass that directly.
    
    # Extract Target Prediction
    final_forecast = future_df.iloc[-1]
    forecast_date = final_forecast['Date']
    print(f"Forecast Target Date: {forecast_date.date()}")
    
    # --- Generate Outputs ---
    
    # 0. Trend Plot
    print("Generating Trend Plot...")
    trend_file = os.path.join(output_dir, f"trend_forecast_{target_year}.png")
    plot_transect_history(history_df, future_df, transect_cols, trend_file)
    print(f"Trend Plot saved: {trend_file}")

    # 1. Map Overlay
    print("Generating Map...")
    latest_hist = history_df.iloc[-1]
    
    plt.figure(figsize=(12, 12))
    
    # Plot ALL historical shorelines (gray, faint)
    print("Plotting historical shorelines...")
    for _, row in history_df.iterrows():
        hist_pts_i = []
        for i, col in enumerate(transect_cols):
            d = row[col]
            if np.isnan(d): continue
            tr = transects[i]
            pt = tr['origin'] + tr['vector'] * d
            hist_pts_i.append(pt)
        if hist_pts_i:
            pts_arr = np.array(hist_pts_i)
            plt.plot(pts_arr[:,0], pts_arr[:,1], color='gray', alpha=0.3, linewidth=0.5)
    
    # Plot Latest Observed (Blue)
    hist_pts = []
    forecast_pts = []
    valid_indices = []
    
    for i, col in enumerate(transect_cols):
        idx = int(col.split('_')[1])
        tr = transects[idx]
        d_h = latest_hist[col]
        d_f = final_forecast[col]
        
        if np.isnan(d_h) or np.isnan(d_f):
            continue
            
        valid_indices.append(idx)
        p_h = tr['origin'] + tr['vector'] * d_h
        p_f = tr['origin'] + tr['vector'] * d_f
        hist_pts.append(p_h)
        forecast_pts.append(p_f)
        
    hist_pts = np.array(hist_pts)
    forecast_pts = np.array(forecast_pts)
    
    plt.plot(hist_pts[:,0], hist_pts[:,1], 'b-', linewidth=2, label=f'Latest Observed ({latest_hist["Date"].date()})')
    plt.plot(forecast_pts[:,0], forecast_pts[:,1], 'r--', linewidth=3, label=f'Forecast ({forecast_date.date()})')
    
    # Fill
    for i in range(len(hist_pts)-1):
        # Color based on change
        d_h = latest_hist[transect_cols[valid_indices[i]]]
        d_f = final_forecast[transect_cols[valid_indices[i]]]
        change = d_f - d_h
        color = 'lightgreen' if change > 0 else 'salmon'
        
        # Check against next point availability
        if i+1 < len(hist_pts):
            poly = np.array([hist_pts[i], hist_pts[i+1], forecast_pts[i+1], forecast_pts[i]])
            plt.fill(poly[:,0], poly[:,1], color=color, alpha=0.5)
        
    plt.title(f"Shoreline Forecast Map: {target_year}\n(Gray=History, Blue=Latest, Red=Forecast)")
    plt.axis('equal')
    plt.legend()
    map_file = os.path.join(output_dir, f"map_forecast_{target_year}.png")
    plt.savefig(map_file)
    plt.close()
    print(f"Map saved: {map_file}")
    
    # 2. Stats
    print("\n--- Statistics (vs 2025) ---")
    distances = final_forecast[transect_cols].values
    hist_distances = latest_hist[transect_cols].values
    
    change = distances - hist_distances
    avg_shift = np.nanmean(change) * 111000 # meters approx
    max_acc = np.nanmax(change) * 111000
    max_ero = np.nanmin(change) * 111000
    
    print(f"Average Shift: {avg_shift:+.2f} meters")
    print(f"Max Accretion: {max_acc:+.2f} meters")
    print(f"Max Erosion:   {max_ero:+.2f} meters")
    
    # 3. KML Generation
    print("Generating KML...")
    kml_points = []
    # Use valid_indices or loop all to reconstruct
    # We need to loop all transects to get the full line strip
    for i, col in enumerate(transect_cols):
        idx = int(col.split('_')[1])
        tr = transects[idx]
        dist = final_forecast[col]
        
        if np.isnan(dist):
            continue
            
        pt = tr['origin'] + tr['vector'] * dist
        kml_points.append(pt)
        
    coord_str_list = []
    for p in kml_points:
        coord_str_list.append(f"{p[0]:.14f},{p[1]:.14f},0")
    
    coord_str = " ".join(coord_str_list)
    
    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
	<name>Forecast {target_year}</name>
	<Style id="red_line">
		<LineStyle>
			<color>ff0000ff</color>
			<width>4</width>
		</LineStyle>
	</Style>
	<Placemark>
		<name>Forecast Shoreline {target_year}</name>
		<styleUrl>#red_line</styleUrl>
		<LineString>
			<tessellate>1</tessellate>
			<coordinates>
				{coord_str}
			</coordinates>
		</LineString>
	</Placemark>
</Document>
</kml>
"""
    kml_file = os.path.join(output_dir, f"forecast_{target_year}.kml")
    with open(kml_file, "w") as f:
        f.write(kml_content)
    print(f"KML saved: {kml_file}")

    # Save CSV result
    csv_file = os.path.join(output_dir, f"forecast_data_{target_year}.csv")
    final_forecast.to_frame().T.to_csv(csv_file, index=False)
    print(f"Data saved: {csv_file}")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    interactive_main()
