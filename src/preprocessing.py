import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from scipy.spatial.distance import cdist

def create_baseline(all_coords):
    """
    Fits a straight line to all shoreline points to serve as a baseline.
    Returns (slope, intercept, min_lat, max_lat).
    Note: lat is Y, lon is X. We treat Longitude as function of Latitude for vertical-ish coastlines,
    or Latitude as function of Longitude for horizontal-ish.
    Kalmunai is roughly North-South, so we fit Lon = m * Lat + c
    """
    # Flatten all coordinates
    all_points = np.vstack(all_coords)
    X_lon = all_points[:, 0]
    y_lat = all_points[:, 1]
    
    # Check orientation: variance in Lat vs Lon
    # If var(Lat) > var(Lon), it's North-South (Kalmunai). fit Lon = f(Lat)
    if np.var(y_lat) > np.var(X_lon):
        # Fit Lon = m*Lat + c
        reg = LinearRegression().fit(y_lat.reshape(-1, 1), X_lon)
        slope = reg.coef_[0]
        intercept = reg.intercept_
        orientation = 'NS' # North-South
        min_dim = y_lat.min()
        max_dim = y_lat.max()
    else:
        # Fit Lat = m*Lon + c
        reg = LinearRegression().fit(X_lon.reshape(-1, 1), y_lat)
        slope = reg.coef_[0]
        intercept = reg.intercept_
        orientation = 'EW' # East-West
        min_dim = X_lon.min()
        max_dim = X_lon.begin() # Typo fix: max()
        max_dim = X_lon.max()

    return slope, intercept, orientation, min_dim, max_dim

def generate_transects(slope, intercept, orientation, min_dim, max_dim, num_transects=50):
    """
    Generates transect lines perpendicular to the baseline.
    Returns a list of transects, each defined by a point on the baseline and a direction vector.
    """
    # Generate points along the baseline
    dim_values = np.linspace(min_dim, max_dim, num_transects)
    
    transects = []
    
    if orientation == 'NS':
        # Baseline: Lon = slope * Lat + intercept
        # Vector along baseline: (slope, 1)  [dLon, dLat]
        # Normal vector (perpendicular): (1, -slope) or (-1, slope)
        
        # Let's normalize the normal vector
        normal_vec = np.array([1, -slope])
        normal_vec = normal_vec / np.linalg.norm(normal_vec)
        
        for lat in dim_values:
            lon_base = slope * lat + intercept
            origin = np.array([lon_base, lat])
            transects.append({'origin': origin, 'vector': normal_vec})
            
    else: # EW
        # Baseline: Lat = slope * Lon + intercept
        # Vector along baseline: (1, slope)
        # Normal vector: (-slope, 1)
        
        normal_vec = np.array([-slope, 1])
        normal_vec = normal_vec / np.linalg.norm(normal_vec)
        
        for lon in dim_values:
            lat_base = slope * lon + intercept
            origin = np.array([lon, lat_base])
            transects.append({'origin': origin, 'vector': normal_vec})
            
    return transects

def get_intersection_distance(transect, shoreline_coords):
    """
    Finds the intersection of a transect line with the shoreline.
    Returns resistance (distance) from baseline.
    Simple method: Find the shoreline point closest to the transect line.
    (Geometrically rigorous intersection is harder with discreet points, 
    nearest point is a good approximation if resolution is high).
    """
    origin = transect['origin']
    vec = transect['vector']
    
    # Project shoreline points onto the normal vector relative to origin
    # Projected distance = Dot(point - origin, vector)
    # We want the point that is ON the line defined by origin + t * vec
    # But actually, we just want the distance from origin to shoreline in the direction of 'vec'.
    # Since shoreline is rough, we find the point on shoreline that intersects the ray.
    
    # Alternative robust approach:
    # 1. Select shoreline points within a narrow band of the transect.
    # 2. Average their distances or take the closest.
    
    shoreline_arr = np.array(shoreline_coords)
    
    # Calculate distance of each shoreline point to the transect LINE (not ray)
    # Line defined by P = origin + t * vec
    # Distance to line = |det([vec, point-origin])| / |vec|  (2D cross product magnitude)
    # |vec| is 1.
    
    d_vecs = shoreline_arr - origin
    
    # Cross product in 2D: x1*y2 - x2*y1
    # vec = (vx, vy)
    # d_vec = (dx, dy)
    # cross = vx*dy - vy*dx
    cross_products = vec[0] * d_vecs[:, 1] - vec[1] * d_vecs[:, 0]
    
    # Filter points very close to the line (within some epsilon)
    # This simulates finding the intersection
    # Epsilon depends on data scale. decimal degrees. 1e-4 is ~10m.
    mask = np.abs(cross_products) < 1e-4 
    
    candidates = shoreline_arr[mask]
    
    if len(candidates) == 0:
        # Fallback: just find closest point absolutely? 
        # Or maybe widen search
        closest_idx = np.argmin(np.abs(cross_products))
        candidates = shoreline_arr[closest_idx:closest_idx+1]
        
    # Now find the distance along the vector for these candidates
    # Dot product
    candidate_d_vecs = candidates - origin
    distances = candidate_d_vecs[:, 0] * vec[0] + candidate_d_vecs[:, 1] * vec[1]
    
    # If multiple, take average position
    return np.mean(distances)

def process_shorelines(df_shorelines, num_transects=50):
    """
    Main processing function.
    1. Create baseline.
    2. Cast transects.
    3. Calculate distances for each date.
    """
    # 1. Fit global baseline
    all_coords = df_shorelines['Coordinates'].tolist()
    # Need to flatten logic slightly different than create_baseline expects if passed list of lists
    # create_baseline expects list of list of [x,y]
    slope, intercept, orient, min_d, max_d = create_baseline(all_coords)
    
    print(f"Baseline fitted. Orientation: {orient}, Slope: {slope:.4f}")
    
    # 2. Generate transects
    transects = generate_transects(slope, intercept, orient, min_d, max_d, num_transects)
    
    # 3. Calculate distances
    # Structure: Date, T1, T2, ... Tn
    results = []
    
    for _, row in df_shorelines.iterrows():
        date = row['Date']
        coords = row['Coordinates']
        
        row_data = {'Date': date}
        for i, tr in enumerate(transects):
            dist = get_intersection_distance(tr, coords)
            row_data[f'Transect_{i}'] = dist
            
        results.append(row_data)
        
    return pd.DataFrame(results)

if __name__ == "__main__":
    # Test stub
    pass
