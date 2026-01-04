import pandas as pd
import numpy as np
import os

def calculate_change():
    base_dir = r"e:\coastal\output"
    history_path = os.path.join(base_dir, "processed_data_full.csv")
    forecast_path = os.path.join(base_dir, "forecast_5_years.csv")
    
    print("Loading data...")
    history_df = pd.read_csv(history_path)
    forecast_df = pd.read_csv(forecast_path)
    
    # Identify Transect columns
    transect_cols = [c for c in history_df.columns if c.startswith('Transect_')]
    
    # Get latest historical row
    # Ensure sorted by date
    history_df['Date'] = pd.to_datetime(history_df['Date'])
    forecast_df['Date'] = pd.to_datetime(forecast_df['Date'])
    
    latest_hist = history_df.sort_values('Date').iloc[-1]
    latest_date = latest_hist['Date']
    print(f"Latest Historical Date: {latest_date.date()}")
    
    # Get final forecast row (5 years out)
    final_forecast = forecast_df.sort_values('Date').iloc[-1]
    forecast_date = final_forecast['Date']
    print(f"Forecast Date: {forecast_date.date()}")
    
    # Calculate difference in DEGREES
    # diff = Forecast - History
    # If standard is Distance from Baseline, 
    # Positive Diff means moved AWAY from baseline.
    # Negative Diff means moved TOWARDS baseline.
    # Without visual context of where baseline is, 'Erosion' vs 'Accretion' is ambiguous 
    # just by sign. But magnitude tells us "Change".
    
    diff_degrees = final_forecast[transect_cols] - latest_hist[transect_cols]
    
    # Convert to Meters
    # Approx: 1 deg lat = 111,320m
    # 1 deg lon = 40075000 * cos(lat) / 360
    # Since our distance is Euclidean in (Lon, Lat) space, 
    # and Lat is ~7deg (Sri Lanka), Cos(7) ~ 0.99.
    # So 1 unit ~ 111km is a safe uniform approx for small changes.
    # more precise:
    # Latitude of Kalmunai approx 7.4N
    lat_rad = np.radians(7.4)
    m_per_deg_lat = 111132.95
    m_per_deg_lon = 111412.84 * np.cos(lat_rad) - 93.5 * np.cos(3 * lat_rad)
    # Average scale factor? 
    # Since our transects are likely perpendicular to coast, 
    # if coast is N-S, change is in Lon. Use m_per_deg_lon.
    # if coast is E-W, change is in Lat. Use m_per_deg_lat.
    
    # Let's check variance to guess orientation again or just use avg.
    # The error between 110.5km and 111km is <1%.
    METERS_PER_DEG = 111000.0 
    
    diff_meters = diff_degrees * METERS_PER_DEG
    
    # Stats
    avg_change_m = diff_meters.mean()
    max_accretion_m = diff_meters.max()
    max_erosion_m = diff_meters.min()
    abs_change_m = diff_meters.abs().mean()
    
    print("\n--- Shoreline Change Analysis (5 Years) ---")
    print(f"Average Shift: {avg_change_m:.2f} meters")
    print(f"Mean Absolute Change: {abs_change_m:.2f} meters")
    print(f"Max Possible Accretion (Shift +): {max_accretion_m:.2f} meters")
    print(f"Max Possible Erosion (Shift -): {max_erosion_m:.2f} meters")
    
    # Save per-transect details
    change_df = pd.DataFrame({
        'Transect': transect_cols,
        'Change_Degrees': diff_degrees,
        'Change_Meters': diff_meters
    })
    output_file = os.path.join(base_dir, "shoreline_change_meters.csv")
    change_df.to_csv(output_file, index=False)
    print(f"\nDetailed change per transect saved to: {output_file}")

if __name__ == "__main__":
    calculate_change()
