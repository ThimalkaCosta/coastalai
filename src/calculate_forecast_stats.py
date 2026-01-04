import pandas as pd
import numpy as np
import os
from sklearn.linear_model import LinearRegression

def calculate_stats():
    base_dir = r"e:\coastal\output"
    history_path = os.path.join(base_dir, "processed_data_full.csv")
    forecast_path = os.path.join(base_dir, "forecast_5_years.csv")
    
    # Load Data
    hist_df = pd.read_csv(history_path)
    fore_df = pd.read_csv(forecast_path)
    
    # Ensure Dates
    hist_df['Date'] = pd.to_datetime(hist_df['Date'])
    fore_df['Date'] = pd.to_datetime(fore_df['Date'])
    
    # Transect Columns
    transect_cols = [c for c in hist_df.columns if c.startswith('Transect_')]
    
    stats_rows = []
    
    for col in transect_cols:
        # Combine series
        # Get (Date, Distance) pairs
        ts_hist = hist_df[['Date', col]].dropna()
        ts_fore = fore_df[['Date', col]].dropna()
        
        combined = pd.concat([ts_hist, ts_fore]).sort_values('Date')
        
        if combined.empty:
            continue
            
        distances = combined[col].values
        dates = combined['Date'].values
        
        # 1. SCE (Shoreline Change Envelope): Max - Min distance
        sce = np.max(distances) - np.min(distances)
        
        # 2. NSM (Net Shoreline Movement): Newest - Oldest
        # Note: DSAS usually defines NSM as Newest - Oldest. Positive = Accretion (if moving seaward).
        # Our distances are "from baseline".
        # Assuming Baseline is inland, larger distance = seaward.
        # So New - Old is correct for accretion.
        nsm = distances[-1] - distances[0]
        
        # 3. EPR (End Point Rate): NSM / Time (years)
        # Time in years
        time_span_days = (dates[-1] - dates[0]).astype('timedelta64[D]').astype(int)
        time_span_years = time_span_days / 365.25
        
        if time_span_years > 0:
            epr = nsm / time_span_years
        else:
            epr = 0
            
        # 4. LRR (Linear Regression Rate)
        # Slope of Distance vs Time
        # X = years from start
        start_date = dates[0]
        days_from_start = (dates - start_date).astype('timedelta64[D]').astype(int)
        X = days_from_start.reshape(-1, 1)
        y = distances
        
        if len(y) > 1:
            reg = LinearRegression().fit(X, y)
            slope_per_day = reg.coef_[0]
            lrr = slope_per_day * 365.25 # per year
        else:
            lrr = 0
            
        # Format output row similar to requested format
        # id, SCE, NSM, EPR, LRR
        t_id = int(col.split('_')[1])
        
        stats_rows.append({
            'Trans_ID': t_id,
            'SCE': round(sce, 2),
            'NSM': round(nsm, 2),
            'EPR': round(epr, 2),
            'LRR': round(lrr, 2),
            'Oldest_Year': pd.to_datetime(dates[0]).year,
            'Newest_Year': pd.to_datetime(dates[-1]).year
        })
        
    stats_df = pd.DataFrame(stats_rows)
    stats_df = stats_df.sort_values('Trans_ID')
    
    # Filter columns as requested
    output_cols = ['Trans_ID', 'SCE', 'NSM', 'EPR', 'LRR']
    stats_df = stats_df[output_cols]
    
    # Save
    out_path = os.path.join(base_dir, "forecast_stats_report.csv")
    stats_df.to_csv(out_path, index=False)
    
    print(f"Computed stats for {len(stats_df)} transects.")
    print(stats_df.head())
    print(f"Saved to {out_path}")

if __name__ == "__main__":
    calculate_stats()
