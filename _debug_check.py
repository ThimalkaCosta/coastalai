import pandas as pd
import xarray as xr

# Check wind monsoon years
wind_ds = xr.open_dataset("notebook_data/Global Ocean Monthly Mean Sea Surface Wind and Stress from Scatterometer and Model_2009_2024.nc")
wind_df = wind_ds[['wind_speed']].to_dataframe().reset_index().dropna(subset=['wind_speed'])

def assign_monsoon_year(time):
    ts = pd.Timestamp(time)
    return ts.year if ts.month >= 4 else ts.year - 1

wind_df['monsoon_year'] = wind_df['time'].apply(assign_monsoon_year)
monsoon_years = sorted(wind_df['monsoon_year'].unique())
print("Wind monsoon years:", monsoon_years)

# Check erosion years
dsas = pd.read_csv("notebook_data/all_stats_new.csv")
sa = dsas.groupby('SCE_closest_year').agg(annual_NSM=('NSM','mean')).reset_index()
sa.columns = ['year','annual_NSM']
erosion_yrs = sa[sa['annual_NSM'] < -1.0]['year'].tolist()
print("Erosion years:", erosion_yrs)
print("Overlap:", [y for y in erosion_yrs if y in monsoon_years])
print("Missing:", [y for y in erosion_yrs if y not in monsoon_years])
