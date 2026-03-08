import time
import ee

# ----------------------------
# CONFIG
# ----------------------------
PROJECT = "react-login-457609"   # <-- put your GEE project id here (or set to None)
OUT_FOLDER = "GEE_S2_all"    # Google Drive folder name
START_DATE = "2016-01-01"
END_DATE   = "2026-12-31"
CLOUD_MAX  = 40              # increase to get more images (20 is strict)
SCALE_M    = 10

# Your bbox (W, S, E, N)
WEST  = 79.99446080745241
SOUTH = 6.350244196040103
EAST  = 80.01896477242468
NORTH = 6.370599527449662

# Limit how many export tasks you start at once
MAX_ACTIVE_TASKS = 3

# ----------------------------
# INIT EE
# ----------------------------
if PROJECT:
    ee.Initialize(project=PROJECT)
else:
    ee.Initialize()

region = ee.Geometry.Rectangle([WEST, SOUTH, EAST, NORTH])

# ----------------------------
# COLLECTION: Sentinel-2 SR
# ----------------------------
col = (
    ee.ImageCollection("COPERNICUS/S2_SR")
    .filterBounds(region)
    .filterDate(START_DATE, END_DATE)
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_MAX))
    .sort("system:time_start")
)

count = col.size().getInfo()
print("Total images to export:", count)

# Convert collection to a client-side list of image IDs/time
img_list = col.toList(count)

def active_tasks():
    """How many tasks are currently RUNNING or READY."""
    tasks = ee.batch.Task.list()
    return sum(t.status()["state"] in ("READY", "RUNNING") for t in tasks)

def wait_for_slot(max_active=MAX_ACTIVE_TASKS, sleep_s=20):
    while active_tasks() >= max_active:
        print("⏳ Waiting for free task slot... active =", active_tasks())
        time.sleep(sleep_s)

for i in range(count):
    img = ee.Image(img_list.get(i)).clip(region)

    # Create a nice timestamp name
    date_str = ee.Date(img.get("system:time_start")).format("YYYYMMdd_HHmm").getInfo()
    name = f"S2_{date_str}"

    # Wait until there is a free task slot
    wait_for_slot()

    task = ee.batch.Export.image.toDrive(
        image=img.select(["B4", "B3", "B2"]),   # RGB (10m)
        description=name,
        folder=OUT_FOLDER,
        fileNamePrefix=name,
        region=region,
        scale=SCALE_M,
        maxPixels=1e13,
        fileFormat="GeoTIFF",
    )

    task.start()
    print(f"✅ Started export {i+1}/{count}: {name}")

print("🚀 All tasks submitted. Check Google Drive >", OUT_FOLDER)