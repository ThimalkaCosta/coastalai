import pandas as pd
import numpy as np
import os
from data_loader import load_all_shorelines
from preprocessing import create_baseline, generate_transects

def export_forecast_kml():
    base_dir = r"e:\coastal"
    data_dir = os.path.join(base_dir, "data", "high_res_kml")
    output_dir = os.path.join(base_dir, "output")
    
    # 1. Load Data & Re-create Transects
    print("Loading geometry...")
    shorelines_df = load_all_shorelines(data_dir)
    all_coords = shorelines_df['Coordinates'].tolist()
    
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects=50)
    
    # 2. Load Forecast
    print("Loading forecast...")
    forecast_path = os.path.join(output_dir, "forecast_5_years.csv")
    forecast_df = pd.read_csv(forecast_path)
    
    # Get 2030 Forecast
    final_forecast = forecast_df.iloc[-1]
    forecast_date = pd.to_datetime(final_forecast['Date']).date()
    print(f"Exporting forecast for {forecast_date}")
    
    transect_cols = [c for c in forecast_df.columns if c.startswith('Transect_')]
    
    # 3. Reconstruct Points
    points = []
    
    for i, col in enumerate(transect_cols):
        idx = int(col.split('_')[1])
        tr = transects[idx]
        dist = final_forecast[col]
        
        if np.isnan(dist):
            continue
            
        pt = tr['origin'] + tr['vector'] * dist
        points.append(pt)
        
    # 4. Generate KML Content
    # Format: lon,lat,0 lon,lat,0 ...
    coord_str_list = []
    for p in points:
        coord_str_list.append(f"{p[0]:.14f},{p[1]:.14f},0")
    
    coord_str = " ".join(coord_str_list)
    
    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
	<name>Forecast {forecast_date}</name>
	<Style id="red_line">
		<LineStyle>
			<color>ff0000ff</color>
			<width>4</width>
		</LineStyle>
	</Style>
	<Placemark>
		<name>Forecast Shoreline {forecast_date}</name>
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
    
    output_file = os.path.join(output_dir, f"forecast_{forecast_date}.kml")
    with open(output_file, "w") as f:
        f.write(kml_content)
        
    print(f"KML saved to {output_file}")

if __name__ == "__main__":
    export_forecast_kml()
