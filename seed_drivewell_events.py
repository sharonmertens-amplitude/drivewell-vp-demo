#!/usr/bin/env python3
"""
Seed synthetic Drivewell DMS events into an Amplitude project.

Usage:
    export AMPLITUDE_API_KEY="your_project_api_key"
    python3 seed_drivewell_events.py --dry-run     # preview, sends nothing
    python3 seed_drivewell_events.py               # actually sends

Stdlib only. No pip install needed.
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta

BATCH_URL = "https://api2.amplitude.com/batch"

# ---------------------------------------------------------------------------
# CONFIG — check these against your Events tab in Amplitude before running.
# If the site already tracks events under different names, change them here so
# the seeded data merges with the real data instead of creating duplicates.
# ---------------------------------------------------------------------------

EVENTS = {
    "page": "Page Viewed",
    "dashboard": "Dashboard Viewed",
    "start_deal": "Start New Deal Clicked",
    "step": "Deal Step Completed",
    "vehicle": "Vehicle Selected",
    "abandon": "Deal Abandoned",
    "deal_created": "Deal Created",
    "deal_opened": "Deal Opened",
    "deal_ready": "Deal Ready To Sign",
    "appointment": "Appointment Scheduled",
    "customer_lookup": "Customer Looked Up",
    "repair_order": "Repair Order Opened",
    "part": "Part Ordered",
}

# The 4 wizard steps, matching the site's deal flow
WIZARD_STEPS = [(1, "Customer"), (2, "Vehicle"), (3, "Trade & terms"), (4, "Review")]

STORES = [
    ("DW-014", "Drivewell North"),
    ("DW-022", "Drivewell Westside"),
    ("DW-031", "Drivewell Airport"),
    ("DW-045", "Drivewell Riverside"),
]

ROLES = [
    ("Sales Manager", 34),
    ("Sales Consultant", 38),
    ("Service Advisor", 16),
    ("F&I Manager", 7),
    ("Parts Advisor", 5),
]

VEHICLES = [
    "2021 Meridian Vante", "New Crest", "New Solo EV", "2019 Meridian Crest",
    "Pre-owned Vante", "2022 Solo EV", "New Meridian Vante", "Pre-owned Crest",
]

DEAL_TYPES = ["New", "Pre-owned", "Certified Pre-owned"]
FINANCE = ["financing", "cash", "lease", "trade-in pending"]

N_USERS = 140
DAYS_BACK = 30

# Funnel conversion rates, split by tenure. This is the shape that motivates
# the guide: new hires fall out of the deal workflow more than tenured staff.
CONVERSION = {
    # tenure_band: (start_deal, deal_created, deal_ready)
    "new":       (0.42, 0.51, 0.44),
    "ramping":   (0.58, 0.68, 0.63),
    "tenured":   (0.74, 0.85, 0.79),
}


def weighted_choice(pairs):
    total = sum(w for _, w in pairs)
    r = random.uniform(0, total)
    upto = 0
    for item, w in pairs:
        upto += w
        if upto >= r:
            return item
    return pairs[-1][0]


def make_users():
    users = []
    for i in range(N_USERS):
        store_id, store_name = random.choice(STORES)
        role = weighted_choice(ROLES)

        roll = random.random()
        if roll < 0.28:
            tenure_band, tenure_days = "new", random.randint(3, 60)
        elif roll < 0.55:
            tenure_band, tenure_days = "ramping", random.randint(61, 240)
        else:
            tenure_band, tenure_days = "tenured", random.randint(241, 2400)

        users.append({
            # Amplitude requires user_id of at least 5 characters
            "user_id": f"drivewell_user_{1000 + i}",
            "device_id": str(uuid.uuid4()),
            "user_properties": {
                "role": role,
                "store_id": store_id,
                "store_name": store_name,
                "dealer_group": "Drivewell Auto Group",
                "tenure_days": tenure_days,
                "tenure_band": tenure_band,
                "region": random.choice(["Midwest", "Southeast", "Northeast", "West"]),
            },
            "tenure_band": tenure_band,
            "role": role,
            "store_id": store_id,
        })
    return users


def ts_ms(dt):
    return int(dt.timestamp() * 1000)


def business_hour_dt(day_offset):
    """A plausible timestamp during dealership hours."""
    base = datetime.now() - timedelta(days=day_offset)
    hour = random.choices(
        [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        weights=[3, 7, 9, 10, 8, 7, 9, 10, 11, 9, 6, 3],
    )[0]
    return base.replace(
        hour=hour,
        minute=random.randint(0, 59),
        second=random.randint(0, 59),
        microsecond=0,
    )


def build_event(user, event_type, dt, props=None):
    ev = {
        "user_id": user["user_id"],
        "device_id": user["device_id"],
        "event_type": event_type,
        "time": ts_ms(dt),
        "user_properties": user["user_properties"],
        "platform": "Web",
        "os_name": random.choice(["Chrome", "Edge", "Safari"]),
        "insert_id": str(uuid.uuid4()),
    }
    if props:
        ev["event_properties"] = props
    return ev


def generate_events(users):
    events = []

    for user in users:
        # Weekday-weighted session count over the window
        n_sessions = random.randint(4, 22)
        session_days = sorted(random.sample(range(DAYS_BACK), min(n_sessions, DAYS_BACK)))

        for day_offset in session_days:
            dt = business_hour_dt(day_offset)

            # Everyone lands on the dashboard
            events.append(build_event(user, EVENTS["page"], dt, {
                "page_name": "Dashboard",
                "store_id": user["store_id"],
            }))
            events.append(build_event(user, EVENTS["dashboard"], dt, {
                "store_id": user["store_id"],
                "surface": "dashboard",
            }))

            # Sales roles run the deal funnel
            if user["role"] in ("Sales Manager", "Sales Consultant", "F&I Manager"):
                p_start, p_created, p_ready = CONVERSION[user["tenure_band"]]

                if random.random() < p_start:
                    t1 = dt + timedelta(seconds=random.randint(20, 240))
                    events.append(build_event(user, EVENTS["start_deal"], t1, {
                        "entry_point": random.choice(["dashboard", "salesdesk"]),
                        "store_id": user["store_id"],
                    }))

                    deal_type = random.choice(DEAL_TYPES)
                    vehicle = random.choice(VEHICLES)
                    amount = round(random.uniform(18000, 62000), 2)

                    # Walk the 4 wizard steps. Each step has its own chance of
                    # drop-off, weighted by tenure — new hires stall mid-flow.
                    per_step = p_created ** 0.25
                    t_cursor = t1
                    reached = 0

                    for step_no, step_name in WIZARD_STEPS:
                        if random.random() > per_step:
                            events.append(build_event(user, EVENTS["abandon"], t_cursor, {
                                "last_step": step_no,
                                "step_name": step_name,
                                "store_id": user["store_id"],
                            }))
                            break

                        t_cursor = t_cursor + timedelta(seconds=random.randint(25, 260))
                        events.append(build_event(user, EVENTS["step"], t_cursor, {
                            "step_number": step_no,
                            "step_name": step_name,
                            "store_id": user["store_id"],
                        }))
                        reached = step_no

                        if step_no == 2:
                            events.append(build_event(user, EVENTS["vehicle"],
                                t_cursor - timedelta(seconds=random.randint(5, 20)),
                                {"vehicle": vehicle, "store_id": user["store_id"]}))

                    if reached == 4:
                        t2 = t_cursor + timedelta(seconds=random.randint(10, 90))
                        events.append(build_event(user, EVENTS["deal_created"], t2, {
                            "deal_type": deal_type,
                            "vehicle": vehicle,
                            "finance_type": random.choice(FINANCE),
                            "deal_amount": amount,
                            "store_id": user["store_id"],
                        }))

                        if random.random() < p_ready:
                            t3 = t2 + timedelta(minutes=random.randint(20, 600))
                            events.append(build_event(user, EVENTS["deal_ready"], t3, {
                                "deal_id": f"D-{random.randint(4000, 4999)}",
                                "vehicle": vehicle,
                                "deal_amount": amount,
                                "store_id": user["store_id"],
                            }))

            # Service side
            if user["role"] == "Service Advisor" and random.random() < 0.72:
                t = dt + timedelta(seconds=random.randint(30, 400))
                events.append(build_event(user, EVENTS["repair_order"], t, {
                    "service_type": random.choice([
                        "Oil & tire rotation", "Brake inspection", "Diagnostic",
                        "Warranty repair", "Multi-point inspection",
                    ]),
                    "store_id": user["store_id"],
                }))

            # Ambient actions across roles
            if random.random() < 0.45:
                events.append(build_event(
                    user, EVENTS["appointment"],
                    dt + timedelta(seconds=random.randint(30, 600)),
                    {"appointment_type": random.choice(["Test drive", "Service", "Delivery"]),
                     "store_id": user["store_id"]},
                ))
            if random.random() < 0.38:
                events.append(build_event(
                    user, EVENTS["customer_lookup"],
                    dt + timedelta(seconds=random.randint(10, 300)),
                    {"store_id": user["store_id"]},
                ))

    events.sort(key=lambda e: e["time"])
    return events


def send_batch(api_key, batch, attempt=1):
    payload = json.dumps({"api_key": api_key, "events": batch}).encode("utf-8")
    req = urllib.request.Request(
        BATCH_URL,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "*/*"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        # 429 = throttled, 500-ish = transient. Back off and retry.
        if e.code in (429, 500, 502, 503, 504) and attempt <= 4:
            wait = 2 ** attempt
            print(f"  ! HTTP {e.code}, retrying in {wait}s (attempt {attempt})")
            time.sleep(wait)
            return send_batch(api_key, batch, attempt + 1)
        return e.code, body
    except urllib.error.URLError as e:
        return None, f"Network error: {e.reason}"


def summarize(events, users):
    from collections import Counter
    by_type = Counter(e["event_type"] for e in events)
    by_band = Counter(u["tenure_band"] for u in users)

    print("\n" + "=" * 58)
    print(f"  {len(events):,} events across {len(users)} users, last {DAYS_BACK} days")
    print("=" * 58)
    for name, count in by_type.most_common():
        print(f"  {count:>6,}  {name}")

    print("\n  Deal funnel:")
    st = by_type[EVENTS["start_deal"]]
    c  = by_type[EVENTS["deal_created"]]
    r  = by_type[EVENTS["deal_ready"]]
    ab = by_type[EVENTS["abandon"]]
    if st:
        print(f"    Started {st:,} -> Created {c:,} ({c/st:.0%}) -> Ready {r:,} ({r/max(c,1):.0%})")
        print(f"    Abandoned mid-flow: {ab:,}")

    print(f"\n  Tenure bands: " + ", ".join(f"{k}={v}" for k, v in by_band.items()))
    print("=" * 58 + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true",
                    help="Generate and summarize, but send nothing")
    ap.add_argument("--sample", action="store_true",
                    help="Print 3 example event payloads")
    ap.add_argument("--batch-size", type=int, default=500)
    ap.add_argument("--seed", type=int, default=None,
                    help="Random seed, for reproducible re-runs")
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    users = make_users()
    events = generate_events(users)
    summarize(events, users)

    if args.sample:
        print("Sample payloads:\n")
        for e in random.sample(events, 3):
            print(json.dumps(e, indent=2))
            print()

    if args.dry_run:
        print("DRY RUN — nothing sent. Remove --dry-run to send for real.\n")
        return

    api_key = os.environ.get("AMPLITUDE_API_KEY")
    if not api_key:
        print("ERROR: set AMPLITUDE_API_KEY first:\n")
        print('  export AMPLITUDE_API_KEY="your_project_api_key"\n')
        sys.exit(1)

    total = len(events)
    sent = 0
    failed = 0

    for i in range(0, total, args.batch_size):
        batch = events[i:i + args.batch_size]
        status, body = send_batch(api_key, batch)
        if status == 200:
            sent += len(batch)
            print(f"  ok  {sent:,}/{total:,}")
        else:
            failed += len(batch)
            print(f"  FAILED batch at {i} — status {status}")
            print(f"       {body[:400]}")
        time.sleep(0.35)  # stay well under the rate limit

    print(f"\nDone. Sent {sent:,}, failed {failed:,}.")
    print("Give Amplitude a few minutes, then check the Events tab.\n")


if __name__ == "__main__":
    main()
