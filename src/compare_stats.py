import pandas as pd
import numpy as np
import os

def compare_stats():
    base_dir = r"e:\coastal\output"
    data_dir = r"e:\coastal\data"
    
    # Files
    hist_stats_path = os.path.join(data_dir, "all_stat_csv.csv")
    forecast_stats_path = os.path.join(base_dir, "forecast_stats_report.csv")
    
    # Load
    print("Loading datasets...")
    # Historical (User provided)
    hist_df = pd.read_csv(hist_stats_path)
    # My generated stats (History + Forecast)
    fore_df = pd.read_csv(forecast_stats_path)
    
    # Align Dataframes
    # User hist_df has 'id' (1, 2, 3...)
    # FORE_df has 'Trans_ID' (0, 1, 2...)
    # Let's verify alignment assumption.
    # Assuming User ID 1 == My ID 0.
    
    # Sort both just in case
    hist_df = hist_df.sort_values('id').reset_index(drop=True)
    fore_df = fore_df.sort_values('Trans_ID').reset_index(drop=True)
    
    # Check lengths
    len_h = len(hist_df)
    len_f = len(fore_df)
    print(f"Historical rows: {len_h}, Forecast rows: {len_f}")
    
    min_len = min(len_h, len_f)
    if min_len < 1:
        print("Error: Empty dataframes.")
        return

    # Create Comparison DF
    comparison_rows = []
    
    for i in range(min_len):
        h_row = hist_df.iloc[i]
        f_row = fore_df.iloc[i]
        
        # Columns to compare: NSM, EPR, LRR
        # Note: Columns might have slightly different names or case
        # User columns: NSM, EPR, LRR, SCE
        # My columns: NSM, EPR, LRR, SCE (created in prev step)
        
        # Calculate Deltas (New - Old)
        # Change in Rate
        delta_nsm = f_row['NSM'] - h_row['NSM']
        delta_epr = f_row['EPR'] - h_row['EPR']
        delta_lrr = f_row['LRR'] - h_row['LRR']
        delta_sce = f_row['SCE'] - h_row['SCE']
        
        comparison_rows.append({
            'Trans_ID': f_row['Trans_ID'],
            'User_ID': h_row['id'],
            # NSM
            'Hist_NSM': h_row['NSM'],
            'Fore_NSM': f_row['NSM'], # (Total NSM 2010-2030)
            'Delta_NSM': round(delta_nsm, 2),
            # EPR
            'Hist_EPR': h_row['EPR'],
            'Fore_EPR': f_row['EPR'],
            'Delta_EPR': round(delta_epr, 3), # Rate differences are small
            # LRR
            'Hist_LRR': h_row['LRR'],
            'Fore_LRR': f_row['LRR'],
            'Delta_LRR': round(delta_lrr, 3)
        })
        
    comp_df = pd.DataFrame(comparison_rows)
    
    # Save
    out_path = os.path.join(base_dir, "stats_comparison_delta.csv")
    comp_df.to_csv(out_path, index=False)
    
    print("\n--- Comparison Summary ---")
    print(f"Average Change in EPR (End Point Rate): {comp_df['Delta_EPR'].mean():.4f} m/yr")
    print(f"Average Change in LRR (Linear Regression Rate): {comp_df['Delta_LRR'].mean():.4f} m/yr")
    print(f"Average Additional NSM (Net Movement): {comp_df['Delta_NSM'].mean():.2f} m")
    
    print(f"\nSaved detailed comparison to {out_path}")

if __name__ == "__main__":
    compare_stats()
