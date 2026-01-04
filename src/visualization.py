import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from src.preprocessing import create_baseline, generate_transects

def plot_transect_history(history_df, future_df, transect_cols, output_path):
    """
    Plots the average erosion/accretion trend over time.
    """
    plt.figure(figsize=(10, 6))
    
    # Calculate average distance across all transects to show general trend
    avg_hist = history_df[transect_cols].mean(axis=1)
    avg_fut = future_df[transect_cols].mean(axis=1)
    
    plt.plot(history_df['Date'], avg_hist, 'o-', label='Historical (Avg)')
    plt.plot(future_df['Date'], avg_fut, 'x--', label='Forecast (Avg)')
    
    plt.xlabel('Year')
    plt.ylabel('Average Distance from Baseline (deg/m equivalent)')
    plt.title('Shoreline Position Forecast (Average across all transects)')
    plt.legend()
    plt.grid(True)
    plt.savefig(output_path)
    plt.close()

def reconstruct_shoreline(transects, distances):
    """
    Reconstructs (lon, lat) points from transect origin + vector * distance.
    """
    points = []
    for tr, dist in zip(transects, distances):
        if np.isnan(dist):
            continue
        # point = origin + vector * distance
        pt = tr['origin'] + tr['vector'] * dist
        points.append(pt)
    return np.array(points)

def plot_map_visualization(history_df, future_df, transect_config, output_path):
    """
    Plots the physical map view of shorelines (Historical vs Predicted).
    """
    # Recalculate transect geometry to map distances back to coordinates
    # We need the baseline parameters. 
    # Since we don't save them easily, we'll re-derive or pass them.
    # Actually, main.py has the transect objects if we reconstruct them.
    # To keep it loosely coupled, let's just assume we re-run generic baseline.
    pass 
    # Skipping complex map reconstruction in this simplified function 
    # unless we pass the transect objects explicitly.
    
    # Simplified: Just plot the raw points if available, but future only has distances.
    # We need the transect definitions to inversing.
    
    # Moving this logic to main.py where we have the transects.
