# Drivewell DMS — Amplitude Guides demo

A fake dealer management system for demoing Amplitude Guides & Surveys + Analytics.
Static site. No build step, no dependencies.

---

## Setup (10 minutes)

**1. New repo**

Create a repo on GitHub — e.g. `drivewell-vp-demo`. Drop these four files in the root:

```
index.html
styles.css
app.js
config.js
```

**2. Turn on Pages**

Settings → Pages → Source: `Deploy from a branch` → `main` / `(root)` → Save.

Live in ~60 seconds at `https://<you>.github.io/drivewell-vp-demo/`

**3. Add your API key**

Open `config.js`, replace `PASTE_YOUR_API_KEY_HERE` with the API key from the
**demo org** project (not CDK's sandbox). Push.

**4. Confirm**

Load the site. The status bar at the bottom should read:

```
● Amplitude: connected    Guides: ready
```

If Guides says **not detected**, Guides & Surveys isn't enabled on that project —
check the entitlement before you build anything in it.

**5. Seed the data**

```bash
export AMPLITUDE_API_KEY="same_key_as_config.js"
python3 seed_drivewell_events.py --dry-run   # preview
python3 seed_drivewell_events.py             # send
```

~10,000 events, 140 users, 30 days. Takes a few minutes to appear in Amplitude.

---

## What's in it

**Six pages** — Dashboard, Sales Desk, Service, Parts, Customers, Reports.
All client-side routing, so no page reloads to break a guide mid-flow.

**A working 4-step deal wizard.** Start new deal → Customer → Vehicle →
Trade & terms → Review → Deal created. Each step fires its own event, and
closing early fires `Deal Abandoned` with the step number. This is your funnel.

**A persona switcher** (bottom right of the status bar). Four identities:

| Persona | Role | Tenure | Store |
|---|---|---|---|
| M. Carter | Sales Manager | 12 days · new | DW-014 |
| R. Vasquez | Sales Manager | 6 years · tenured | DW-014 |
| T. Boone | Service Advisor | tenured | DW-014 |
| J. Lindqvist | Sales Manager | 38 days · new | DW-045 |

Switching reloads the page and re-identifies the user, so Guides re-evaluate
targeting cleanly. **This is the targeting demo** — build your guide to target
`tenure_band = new`, then switch to R. Vasquez and it doesn't appear.

**A live event feed** (bottom right). Every event appears as it sends.
Toggle with `⌘/Ctrl + E`, or turn it off in `config.js`.

**Stable selectors.** Every element you'd want to pin has a `data-guide`
attribute — `[data-guide="start-new-deal"]`, `[data-guide="kpi-gross"]`, etc.
Nothing is in an iframe or shadow DOM.

---

## Events

| Event | Fires when |
|---|---|
| `Page Viewed` | any nav click (`page_name`) |
| `Dashboard Viewed` | dashboard loads |
| `Start New Deal Clicked` | wizard opens (`entry_point`) |
| `Deal Step Completed` | each wizard step (`step_number`, `step_name`) |
| `Vehicle Selected` | vehicle chosen in step 2 |
| `Deal Abandoned` | wizard closed early (`last_step`) |
| `Deal Created` | wizard finished (`deal_amount`, `vehicle`, `finance_type`) |
| `Deal Opened` | a deal row is clicked |
| `Deal Ready To Sign` | opening D-4409 (the "Ready to sign" deal) |
| `Appointment Scheduled` / `Customer Looked Up` / `Part Ordered` | quick actions |

User properties on every event: `role`, `store_id`, `store_name`,
`dealer_group`, `tenure_days`, `tenure_band`, `region`.

---

## Suggested guide

**Target:** `role = Sales Manager` AND `tenure_band = new`
**Where:** the site URL
**When:** element appears — `[data-guide="start-new-deal"]`

- **Step 1 (modal):** "Your first deal at Drivewell" — orient
- **Step 2 (pin on Start new deal):** "Everything starts here"
- **Step 3 (pin on the working deals card):** "Track it through to signing"

Set to Preview/Testing. In **Limits**, turn off "Stop showing when completed"
while you rehearse, and turn it back on before the demo.

---

## Demo flow

1. **Reports page** — new hires complete 44%, tenured 79%. That gap is the problem.
2. **Amplitude, guide Setup tab** — targeting (role + tenure) vs. triggering (page + element). Say the bit about stable IDs and selectors being the engineering dependency.
3. **Back to the site as M. Carter** — guide fires. Walk it. Start a deal.
4. **Switch to R. Vasquez** — guide doesn't appear. Targeting, proven live.
5. **Back to Amplitude** — guide events landing next to product events, funnel segmented by `tenure_band`. One system.

---

## If something breaks

| Symptom | Check |
|---|---|
| Status bar says "no API key set" | `config.js` still has the placeholder |
| "not connected" | wrong key, or an ad blocker is eating the CDN script |
| "Guides: not detected" | Guides & Surveys not enabled on the project |
| Guide fires once, never again | Limits → "Stop showing when completed" |
| Nothing in the Events tab | wait a few minutes; backdated events lag |
| Pin won't attach | copy the selector from DevTools and paste it manually |
