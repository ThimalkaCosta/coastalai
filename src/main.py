import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from data_loader import load_all_shorelines, load_transect_stats
from preprocessing import process_shorelines, create_baseline, generate_transects
from forecasting import train_and_predict
from visualization import plot_transect_history, reconstruct_shoreline

def main():
    base_dir = r"e:\coastal\data"
    kml_dir = os.path.join(base_dir, "high_res_kml")
    # New Stats File
    stats_path = os.path.join(base_dir, "all_stat_csv.csv")
    
    output_dir = r"e:\coastal\output"
    os.makedirs(output_dir, exist_ok=True)

    print("--- 1. Data Loading ---")
    shorelines_df = load_all_shorelines(kml_dir)
    print(f"Loaded {len(shorelines_df)} shoreline files.")
    
    stats_df = load_transect_stats(stats_path)
    print(f"Loaded {len(stats_df)} rows of transect stats.")
    
    print("--- 2. Processing (Transects) ---")
    all_coords = shorelines_df['Coordinates'].tolist()
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects=50)
    
    # Calculate distances
    from preprocessing import get_intersection_distance
    results = []
    for _, row in shorelines_df.iterrows():
        date = row['Date']
        coords = row['Coordinates']
        row_data = {'Date': date}
        for i, tr in enumerate(transects):
            dist = get_intersection_distance(tr, coords)
            row_data[f'Transect_{i}'] = dist
        results.append(row_data)
    
    history_df = pd.DataFrame(results)
    history_df = history_df.sort_values('Date')
    
    # Save processed history (Distances Only, since we can't merge transect stats by date)
    history_df.to_csv(os.path.join(output_dir, "processed_data_full.csv"), index=False)
    
    # Save a copy of the stats to output for reference
    if not stats_df.empty:
        stats_df.to_csv(os.path.join(output_dir, "transect_stats_reference.csv"), index=False)
    
    print("--- 3. Forecasting ---")
    transect_cols = [c for c in history_df.columns if c.startswith('Transect_')]
    
    # Train forecasting model (Random Forest on Shoreline Positions)
    future_df, models = train_and_predict(history_df, transect_cols, years_ahead=5)
    
    print("Forecast dates:")
    print(future_df['Date'])
    
    # Save forecast
    future_df.to_csv(os.path.join(output_dir, "forecast_5_years.csv"), index=False)
    
    print("--- 4. Visualization ---")
    # 4a. Trend Plot
    plot_transect_history(history_df, future_df, transect_cols, 
                          os.path.join(output_dir, "forecast_trend.png"))
    
    # 4b. Map Plot (Reconstruction)
    plt.figure(figsize=(10, 10))
    
    # Plot Baseline
    p1 = transects[0]['origin']
    p2 = transects[-1]['origin']
    plt.plot([p1[0], p2[0]], [p1[1], p2[1]], 'k-', linewidth=2, label='Baseline')
    
    # Plot Shorelines
    for coords in all_coords:
        c_arr = np.array(coords)
        plt.plot(c_arr[:,0], c_arr[:,1], 'b-', alpha=0.1)
        
    # Plot Future (Final Year)
    last_future_vals = future_df.iloc[-1][transect_cols].values
    future_pts = []
    for i, dist in enumerate(last_future_vals):
        pt = transects[i]['origin'] + transects[i]['vector'] * dist
        future_pts.append(pt)
    future_pts = np.array(future_pts)
    plt.plot(future_pts[:,0], future_pts[:,1], 'r--', linewidth=2, label='Forecast (5yr)')
    
    plt.title(f"Shoreline Forecast: {future_df.iloc[-1]['Date'].date()}")
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    plt.legend()
    plt.axis('equal')
    plt.savefig(os.path.join(output_dir, "forecast_map.png"))
    plt.close()
    
    print(f"Artifacts saved to {output_dir}")

if __name__ == "__main__":
    main()
