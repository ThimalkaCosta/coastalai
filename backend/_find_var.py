import nbformat, glob, os

files = sorted(glob.glob('backend/executed_notebooks/executed_*.ipynb'), key=os.path.getmtime)
nb = nbformat.read(files[-1], as_version=4)

# Show export cell (last cell) and check if Table 3 block is there
export_cell = nb.cells[-1]
src = export_cell.source
print('Has table3ThresholdForecast:', 'table3ThresholdForecast' in src)
print('Has forecast_summary_df check:', 'forecast_summary_df' in src)
idx = src.find('16c')
print('Has 16c marker:', idx >= 0)
if idx >= 0:
    print(src[idx:idx+300])
print('\nExport cell last 500 chars:')
print(src[-500:].encode('ascii', errors='replace').decode())
