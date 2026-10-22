"""Reference implementation copied verbatim from the training notebook
daduru_oya_flood_model/notebooks/01_train_models.ipynb, used to verify the
Node.js feature builder produces identical numbers."""
import json
import numpy as np
import pandas as pd

DB = r"G:\RUSL\4.2\research project new\flood_app\backend\database\daduru_oya.db"
NODE_OUT = r"G:\RUSL\4.2\research project new\flood_app\backend\node_server\feature-check.json"

import sqlite3
con = sqlite3.connect(DB)
rows = pd.read_sql_query(
    "SELECT date, rainfall_mm, water_level_m, soil_moisture FROM station_telemetry "
    "WHERE station_id = 1 AND date <= ? ORDER BY date ASC",
    con,
    params=("2026-10-21",),
)
station = con.execute("SELECT station_name, elevation FROM stations WHERE id = 1").fetchone()

df = rows.copy()
df["station"] = station[0]
df = df.sort_values("date").reset_index(drop=True)

grp = df.groupby("station")

for w in [3, 7, 14, 30]:
    df[f"rain_cumulative_{w}d"] = grp["rainfall_mm"].transform(
        lambda s: s.rolling(w, min_periods=1).sum()
    )


def api_series(rain, k=0.90):
    api = np.zeros(len(rain))
    for i in range(1, len(rain)):
        api[i] = k * api[i - 1] + rain.iloc[i]
    return pd.Series(api, index=rain.index)


df["api"] = grp["rainfall_mm"].transform(api_series)
df["wl_lag1"] = grp["water_level_m"].shift(1)
df["wl_lag2"] = grp["water_level_m"].shift(2)
df["wl_lag3"] = grp["water_level_m"].shift(3)
df["wl_diff"] = df["water_level_m"] - df["wl_lag1"]
df["wl_roll3"] = grp["water_level_m"].transform(lambda s: s.rolling(3, min_periods=1).mean())
df["sm_lag1"] = grp["soil_moisture"].shift(1)
df["sm_diff"] = df["soil_moisture"] - df["sm_lag1"]
df["sm_deficit"] = 1.0 - df["soil_moisture"]

last = df.iloc[-1]
dt = pd.Timestamp(last["date"])
month = dt.month
dayofyear = dt.dayofyear

reference = {
    "rainfall_mm": float(last["rainfall_mm"]),
    "soil_moisture": float(last["soil_moisture"]),
    "elevation": float(station[1]),
    "water_level_m": float(last["water_level_m"]),
    "rain_cumulative_3d": float(last["rain_cumulative_3d"]),
    "rain_cumulative_7d": float(last["rain_cumulative_7d"]),
    "rain_cumulative_14d": float(last["rain_cumulative_14d"]),
    "rain_cumulative_30d": float(last["rain_cumulative_30d"]),
    "api": float(last["api"]),
    "wl_lag1": float(last["wl_lag1"]),
    "wl_lag2": float(last["wl_lag2"]),
    "wl_lag3": float(last["wl_lag3"]),
    "wl_diff": float(last["wl_diff"]),
    "wl_roll3": float(last["wl_roll3"]),
    "sm_lag1": float(last["sm_lag1"]),
    "sm_diff": float(last["sm_diff"]),
    "sm_deficit": float(last["sm_deficit"]),
    "month_sin": float(np.sin(2 * np.pi * month / 12)),
    "month_cos": float(np.cos(2 * np.pi * month / 12)),
    "dayofyear": int(dayofyear),
    "station_code": 0,
}

with open(NODE_OUT) as f:
    node = json.load(f)["features"]

print(f"{'feature':<22}{'python':>18}{'node':>18}   match")
ok = True
for key, ref in reference.items():
    got = node.get(key)
    if got is None:
        match = ref is None
        got_s = "None"
    else:
        match = abs(float(got) - ref) < 1e-9
        got_s = f"{float(got):.10g}"
    ok = ok and match
    print(f"{key:<22}{ref!r:>18}{got_s:>18}   {'OK' if match else 'MISMATCH'}")

print()
print("ALL FEATURES MATCH" if ok else "MISMATCH DETECTED")
