"""Demand histogram trainer used to inspect historical passenger counts.

ETA in the live app is remaining distance / estimated speed, blended with
historical segment times. Demand levels are derived from these counts.
This script is not advertised as an AI model.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).parent / 'datasets' / 'demand_samples.csv'
OUT = Path(__file__).parent / 'models' / 'demand_baseline.json'


def main():
    buckets = defaultdict(list)
    if not DATA.exists():
        print('No dataset yet; API uses PostgreSQL historical_demand instead.')
        return
    with DATA.open() as fh:
        for row in csv.DictReader(fh):
            key = (row['route'], int(row['hour']), int(row['dow']))
            buckets[key].append(int(row['passengers']))
    model = {
        f'{k[0]}|{k[1]}|{k[2]}': round(sum(v) / len(v), 1)
        for k, v in buckets.items()
    }
    OUT.write_text(json.dumps(model, indent=2))
    print(f'Wrote {len(model)} averages to {OUT}')


if __name__ == '__main__':
    main()
