import os
import re
import pandas as pd
import xml.etree.ElementTree as ET
from datetime import datetime
import glob

def parse_kml_date(filename):
    """
    Extracts date from filename like 'SWnew MMDDYYYY.kml'.
    Example: 'SWnew 10222010.kml' -> datetime(2010, 10, 22)
    """
    match = re.search(r'(\d{1,2})(\d{2})(\d{4})', filename)
    if match:
        month, day, year = match.groups()
        return datetime(int(year), int(month), int(day))
    return None

def read_kml_shoreline(filepath):
    """
    Parses a KML file and returns a list of (lon, lat) tuples.
    """
    try:
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
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return []

def load_all_shorelines(kml_dir):
    """
    Loads all KML files from the directory.
    Returns a dataframe with ['Date', 'Coordinates'].
    """
    files = glob.glob(os.path.join(kml_dir, "*.kml"))
    data = []
    
    for f in files:
        filename = os.path.basename(f)
        date_obj = parse_kml_date(filename)
        if date_obj:
            coords = read_kml_shoreline(f)
            if coords:
                data.append({'Date': date_obj, 'Coordinates': coords})
        else:
            # Try alternative pattern if needed, or just report
            # print(f"Skipping {filename}: Could not parse date")
            pass
            
    df = pd.DataFrame(data)
    if not df.empty:
        df = df.sort_values('Date').reset_index(drop=True)
    return df

def load_transect_stats(csv_path):
    """
    Loads the new transect-based statistics (CSV).
    """
    try:
        df = pd.read_csv(csv_path)
        return df
    except Exception as e:
        print(f"Error loading stats CSV: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    pass
