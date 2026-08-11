/* ==========================================================================
   DRIVEWELL DMS — DEMO CONFIG
   This is the ONLY file you need to edit.
   ========================================================================== */

window.DRIVEWELL_CONFIG = {

  // 1. Paste your Amplitude project API key here.
  //    Use the DEMO ORG project, not CDK's sandbox.
  AMPLITUDE_API_KEY: "PASTE_YOUR_API_KEY_HERE",

  // 2. Optional. Shows in the status bar so you know which project you're
  //    pointed at during a screenshare. Purely cosmetic.
  PROJECT_LABEL: "Amplitude Demo Org",

  // 3. Show the live event feed panel? Toggle in-app with the ⌘ / Ctrl + E.
  SHOW_EVENT_FEED: true,

  // 4. Autocapture. Leave on unless it creates noise you don't want.
  AUTOCAPTURE: true,

  // 5. Personas available in the identity switcher.
  //    These user properties are what your Guide targeting reads.
  //    Keep tenure_band values as: new | ramping | tenured
  PERSONAS: [
    {
      id: "new_sales_mgr",
      label: "New Sales Manager",
      hint: "12 days · should see the guide",
      user_id: "drivewell_demo_mcarter",
      name: "M. Carter",
      properties: {
        role: "Sales Manager",
        store_id: "DW-014",
        store_name: "Drivewell North",
        dealer_group: "Drivewell Auto Group",
        tenure_days: 12,
        tenure_band: "new",
        region: "Midwest",
        language: "EN"
      }
    },
    {
      id: "tenured_sales_mgr",
      label: "Tenured Sales Manager",
      hint: "6 years · should NOT see the guide",
      user_id: "drivewell_demo_rvasquez",
      name: "R. Vasquez",
      properties: {
        role: "Sales Manager",
        store_id: "DW-014",
        store_name: "Drivewell North",
        dealer_group: "Drivewell Auto Group",
        tenure_days: 2190,
        tenure_band: "tenured",
        region: "Midwest",
        language: "EN"
      }
    },
    {
      id: "service_advisor",
      label: "Service Advisor",
      hint: "different role · different guide",
      user_id: "drivewell_demo_tboone",
      name: "T. Boone",
      properties: {
        role: "Service Advisor",
        store_id: "DW-014",
        store_name: "Drivewell North",
        dealer_group: "Drivewell Auto Group",
        tenure_days: 430,
        tenure_band: "tenured",
        region: "Midwest",
        language: "EN"
      }
    },
    {
      id: "other_store",
      label: "Sales Manager · other store",
      hint: "DW-045 · store-level targeting",
      user_id: "drivewell_demo_jlindqvist",
      name: "J. Lindqvist",
      properties: {
        role: "Sales Manager",
        store_id: "DW-045",
        store_name: "Drivewell Riverside",
        dealer_group: "Drivewell Auto Group",
        tenure_days: 38,
        tenure_band: "new",
        region: "West",
        language: "EN"
      }
    }
  ]
};
