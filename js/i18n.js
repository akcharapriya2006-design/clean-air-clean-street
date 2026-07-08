/* ==========================================================================
   AeroWatch TN — translation & internationalization engine (Wikipedia style)
   ========================================================================== */

const I18n = (() => {
  const LS_LANG = 'aerowatch_lang_v1';
  let currentLang = localStorage.getItem(LS_LANG) || 'en';

  const dict = {
    en: {
      // Nav & Brand
      brand_name: "AeroWatch TN",
      nav_overview: "Overview",
      nav_live_map: "Live map",
      nav_report: "Report a hotspot",
      nav_ops: "Ops console",
      btn_open_dashboard: "Open dashboard",
      btn_report_smoke_dust: "Report smoke/dust",
      btn_open_live_map: "Open live map",
      btn_view_ops: "View ops console",
      
      // Footer
      footer_text: "AeroWatch TN — a hyperlocal air-quality concept build. All readings are simulated for demonstration.",
      footer_version: "v0.2 · Tamil Nadu Edition",
      
      // Index Page
      hero_eyebrow: "Hyperlocal air quality · live simulation",
      hero_title: "The smoke your city's AQI map never sees.",
      hero_subtitle: "A garbage fire two streets over. A foundry running a night shift. A junction that traps exhaust every evening at six. City-wide sensors average these away — AeroWatch TN fuses citizen photos, ground sensors, and satellite imagery to catch them block by block, then predicts where the air turns bad next.",
      hero_stat_cells: "Cells monitored",
      hero_stat_forecast: "Forecast horizon",
      hero_stat_hotspots: "Active hotspots",
      hero_preview_label: "Chennai · live reading",
      section_how_works: "How it works",
      section_how_works_title: "Three feeds in, one map out, one alert where it matters.",
      step1_title: "01 / Detect",
      step1_name: "Citizens, sensors, satellites",
      step1_desc: "Residents upload photos of smoke or dust with a location tag. Low-cost ground sensors stream readings. Satellite aerosol-optical-depth passes fill the gaps between them.",
      step2_title: "02 / Fuse",
      step2_name: "One grid, not three feeds",
      step2_desc: "Every input lands on the same neighbourhood hex grid, so a photo report and a sensor reading about the same block reinforce — or contradict — each other automatically.",
      step3_title: "03 / Predict",
      step3_name: "24 hours ahead, not just now",
      step3_desc: "A trend model projects each cell forward in 3-hour steps, factoring in traffic cycles, land use, and recent volatility — flagging spikes before residents feel them.",
      step4_title: "04 / Alert",
      step4_name: "Routed to the right crew",
      step4_desc: "Cells crossing the alert threshold generate a dispatch ticket in the municipal ops console — mist cannons, cleanup crews, or an inspection, sent to a street, not a citywide bulletin.",
      
      section_hood: "What's under the hood",
      section_hood_title: "Built for the hotspots city-wide monitors average away.",
      feat1_title: "Citizen photo reports",
      feat1_desc: "Anyone can flag smoke, dust, or a burning pile in under a minute — geotagged, timestamped, and dropped straight onto the grid.",
      feat2_title: "Low-cost sensor mesh",
      feat2_desc: "Ground stations report PM2.5, PM10, and NO₂ every few minutes, anchoring the model with real, continuous readings.",
      feat3_title: "Satellite aerosol imagery",
      feat3_desc: "Where there's no sensor and no report yet, satellite aerosol-optical-depth passes still catch the plume.",
      feat4_title: "Hidden hotspot detection",
      feat4_desc: "The model flags cells trending up with no manned sensor nearby — exactly the blind spots city-wide maps miss.",
      feat5_title: "24h spike forecasting",
      feat5_desc: "Every cell gets a rolling forecast, so crews can be positioned before the air quality index actually crosses into unhealthy territory.",
      feat6_title: "Municipal dispatch console",
      feat6_desc: "Every alert becomes a ticket: acknowledge, assign a mist cannon or cleanup crew, and track it to resolution.",
      cta_title: "See today's hotspots for yourself.",
      cta_desc: "No install, no login — the live map and ops console are open below.",
      
      // Dashboard Page
      dash_title: "Neighbourhood air quality",
      dash_subtitle: "Sensor mesh — hover for detail, click to inspect",
      legend_good: "Good",
      legend_moderate: "Moderate",
      legend_unhealthy_sens: "Unhealthy (sens.)",
      legend_unhealthy: "Unhealthy",
      legend_very_unhealthy: "Very unhealthy+",
      legend_photo_sat: "Photo/satellite only",
      dash_selected_cell: "Selected cell",
      dash_forecast_title: "24h forecast",
      dash_ground_sensors: "Ground sensor readings",
      dash_ops_link: "Open ops console →",
      last_updated_prefix: "Last synced",
      last_updated_suffix: "· refreshes on reload",
      city_all: "All Cities",
      city_filter_label: "City:",
      
      // Report Page
      rep_eyebrow: "Citizen report",
      rep_title: "See smoke, dust, or a burning pile? Put it on the map.",
      rep_desc: "A geotagged photo takes under a minute and feeds straight into the same model used by ground sensors and satellite passes — often the first signal for a hotspot with no sensor nearby.",
      rep_label_loc: "Location",
      rep_placeholder_loc: "Street, junction, or nearby landmark",
      rep_use_loc: "📍 Use my current location",
      rep_label_seeing: "What are you seeing?",
      rep_label_severity: "How bad does it look?",
      rep_label_photo: "Photo",
      rep_dropzone_main: "Drop a photo here, or click to choose one",
      rep_dropzone_hint: "JPG or PNG · stays on this device for this demo",
      rep_label_notes: "Add detail (optional)",
      rep_placeholder_notes: "e.g. Started around 7am, smell of burning plastic, been going for two days",
      rep_label_email: "Email for updates (optional)",
      rep_placeholder_email: "you@example.com",
      rep_btn_submit: "Submit report",
      rep_submit_hint: "Reports feed the same hotspot model shown on the live map — no account needed.",
      rep_confirm_received: "✓ Report received",
      rep_confirm_title: "Thanks — this is now on the grid.",
      rep_confirm_view_map: "View it on the live map",
      rep_intro_note: "Reports are matched to the nearest monitoring cell. Three or more reports for the same block within a few hours are enough to raise a hotspot flag even without a ground sensor there.",
      rep_recent_title: "Recent reports (this device)",
      rep_no_reports: "No reports submitted yet.",
      
      // Ops Page
      ops_eyebrow: "Municipal ops console",
      ops_title: "Dispatch queue",
      ops_stat_open: "Open alerts",
      ops_stat_critical: "Critical severity",
      ops_stat_dispatched: "Crews dispatched",
      ops_stat_resolved: "Resolved today",
      ops_alert_queue: "Alert queue",
      ops_legend_critical: "Critical",
      ops_legend_warning: "Warning",
      ops_legend_resolved: "Resolved",
      ops_resources_title: "Resource roster",
      ops_recent_reports_title: "Recent citizen reports",
      ops_no_recent_reports: "No reports yet — none submitted from this device.",
      
      // Categories and Labels
      cat_good: "Good",
      cat_moderate: "Moderate",
      cat_unhealthy_s: "Unhealthy (Sens.)",
      cat_unhealthy: "Unhealthy",
      cat_very: "Very Unhealthy",
      cat_hazard: "Hazardous",
      
      source_ground: "Ground sensor",
      source_photo_sat: "Photo + satellite only",
      
      type_traffic: "Traffic",
      type_industrial: "Industrial",
      type_residential: "Residential",
      type_green: "Green Zone",
      type_dump: "Dump Yard",
      
      chip_smoke: "Smoke",
      chip_dust: "Dust cloud",
      chip_burning: "Open burning",
      chip_industrial: "Industrial odor",
      chip_haze: "Persistent haze",
      
      chip_mild: "Mild",
      chip_noticeable: "Noticeable",
      chip_severe: "Severe",
      
      status_open: "OPEN",
      status_acknowledged: "ACKNOWLEDGED",
      status_dispatched: "DISPATCHED",
      status_resolved: "RESOLVED",
      
      // Ops Alerts Dynamic Strings
      alert_open: "Alert acknowledged.",
      alert_resolved: "Alert marked resolved.",
      alert_dispatched: "dispatched.",
      btn_ack: "Acknowledge",
      btn_resolve: "Mark resolved",
      select_assign: "Assign resource…",
      predicted_peak: "Predicted peak in",
      logged_at: "Logged",
      assigned: "Assigned"
    },
    ta: {
      // Nav & Brand
      brand_name: "ஏரோவாட்ச் TN",
      nav_overview: "முகப்பு",
      nav_live_map: "நேரலை வரைபடம்",
      nav_report: "மாசடைவை அறிவிக்க",
      nav_ops: "அதிகாரிகள் பணியகம்",
      btn_open_dashboard: "வரைபடத்தைத் திற",
      btn_report_smoke_dust: "புகை/தூசியை அறிவிக்கவும்",
      btn_open_live_map: "நேரலை வரைபடத்தைத் திற",
      btn_view_ops: "பணியகத்தைப் பார்",
      
      // Footer
      footer_text: "ஏரோவாட்ச் TN — ஒரு உள்ளூர் காற்றுத் தர மாதிரி வடிவமைப்பு. அனைத்து அளவீடுகளும் செயல்முறை விளக்கத்திற்காக உருவகப்படுத்தப்பட்டவை.",
      footer_version: "பதிப்பு 0.2 · தமிழ்நாடு பதிப்பு",
      
      // Index Page
      hero_eyebrow: "உள்ளூர் காற்றுத் தரம் · நேரலை உருவகப்படுத்துதல்",
      hero_title: "நகர காற்றுத் தர வரைபடம் கண்டறியாத புகை.",
      hero_subtitle: "இரண்டு தெருக்களுக்கு அப்பால் எரியும் குப்பை. இரவு நேர ஆலையின் புகை. மாலை 6 மணிக்கு வாகன நெரிசலால் தேங்கும் புகை. நகர அளவிலான உணரிகள் இவற்றை அலட்சியப்படுத்துகின்றன — ஏரோவாட்ச் TN குடிமக்கள் புகைப்படங்கள், தரை உணரிகள் மற்றும் செயற்கைக்கோள் தரவுகளை ஒன்றிணைத்து ஒவ்வொரு தெருவாகக் கண்காணித்துக் கணிப்பை வழங்குகிறது.",
      hero_stat_cells: "கண்காணிக்கப்படும் பகுதிகள்",
      hero_stat_forecast: "முன்னறிவிப்பு நேரம்",
      hero_stat_hotspots: "தீவிர மாசுப் பகுதிகள்",
      hero_preview_label: "சென்னை · நேரலை அளவீடு",
      section_how_works: "செயல்முறை எவ்வாறு?",
      section_how_works_title: "மூன்று உள்ளீடுகள், ஒரு வரைபடம், தேவையான இடத்தில் ஒரு எச்சரிக்கை.",
      step1_title: "01 / கண்டறிதல்",
      step1_name: "குடிமக்கள், உணரிகள், செயற்கைக்கோள்",
      step1_desc: "குடிமக்கள் புகை அல்லது தூசியின் புகைப்படத்தை இருப்பிட அடையாளத்துடன் பதிவேற்றுகிறார்கள். மலிவான தரை உணரிகள் அளவீடுகளை வழங்குகின்றன. செயற்கைக்கோள் தரவு இடைவெளிகளை நிரப்புகிறது.",
      step2_title: "02 / ஒருங்கிணைத்தல்",
      step2_name: "மூன்று தனி ஊட்டம் அல்ல, ஒரே கட்டம்",
      step2_desc: "அனைத்து உள்ளீடுகளும் ஒரே உள்ளூர் அறுகோண வரைபடத்தில் இணைகின்றன. இதனால் புகைப்பட புகாரும் சென்சார் அளவீடும் ஒன்றையொன்று உறுதிப்படுத்துகின்றன.",
      step3_title: "03 / கணித்தல்",
      step3_name: "24 மணி நேரத்திற்கு முன்பாகவே கணிப்பு",
      step3_desc: "வாகன சுழற்சி, நிலப்பயன்பாடு மற்றும் சமீபத்திய மாறுபாடுகளைக் கொண்டு ஒரு மாதிரி உருவாக்கப்பட்டு, 24 மணி நேர காற்று மாசு முன்கூட்டியே கணிக்கப்படுகிறது.",
      step4_title: "04 / எச்சரித்தல்",
      step4_name: "சரியான குழுவிற்குப் பணி ஒதுக்கீடு",
      step4_desc: "மாசு வரம்பைக் கடக்கும்போது, நகராட்சி அதிகாரிகள் பணியகத்திற்கு ஒரு எச்சரிக்கை உருவாக்கப்பட்டு, தண்ணீர் தெளிக்கும் வாகனங்கள் அல்லது தூய்மைப் பணியாளர்கள் உடனடியாக அனுப்பப்படுகிறார்கள்.",
      
      section_hood: "தொழில்நுட்ப விவரம்",
      section_hood_title: "நகர அளவிலான உணரிகள் அலட்சியப்படுத்தும் மாசுப் பகுதிகளுக்காக உருவாக்கப்பட்டது.",
      feat1_title: "குடிமக்கள் புகைப்பட புகார்கள்",
      feat1_desc: "எவரும் ஒரு நிமிடத்திற்குள் புகை அல்லது எரியும் குப்பையை புவிக்குறியீட்டுடன் புகாராகப் பதிவுசெய்து வரைபடத்தில் சேர்க்கலாம்.",
      feat2_title: "மலிவு விலை உணரி வலைப்பின்னல்",
      feat2_desc: "தரை உணரிகள் PM2.5, PM10 மற்றும் NO₂ அளவுகளைத் தொடர்ச்சடியாக வழங்கி மாதிரியை வலுப்படுத்துகின்றன.",
      feat3_title: "செயற்கைக்கோள் ஏரோசல் படங்கள்",
      feat3_desc: "உணரியோ அல்லது புகாரோ இல்லாத இடங்களிலும், செயற்கைக்கோள் தூசு மற்றும் புகை மண்டலங்களை துல்லியமாகக் கண்டறிகிறது.",
      feat4_title: "மறைமுக மாசுப் பகுதிகள் கண்டறிதல்",
      feat4_desc: "அருகில் உணரிகள் இல்லாத இடங்களில் மாசு அதிகரிக்கும்போது, அதனை மாதிரி கண்டறிந்து அதிகாரிகளை எச்சரிக்கிறது.",
      feat5_title: "24 மணி நேர முன்னெச்சரிக்கை",
      feat5_desc: "ஒவ்வொரு பகுதிக்கும் முன்னறிவிப்பு வழங்கப்படுவதால், காற்று தரம் மோசமாவதற்கு முன்பாகவே நடவடிக்கைகளைத் திட்டமிடலாம்.",
      feat6_title: "நகராட்சி பணி ஒதுக்கீடு கன்சோல்",
      feat6_desc: "ஒவ்வொரு எச்சரிக்கையும் ஒரு டிக்கெட்டாக மாற்றப்பட்டு, ஒப்புதல், பணியாளர்கள் ஒதுக்கீடு மற்றும் தீர்வு வரை கண்காணிக்கப்படுகிறது.",
      cta_title: "இன்றைய மாசுப் பகுதிகளைக் கண்காணிக்கவும்.",
      cta_desc: "நிறுவல் அல்லது உள்நுழைவு தேவையில்லை — நேரலை வரைபடம் மற்றும் அதிகாரிகள் பணியகம் கீழே திறக்கப்பட்டுள்ளன.",
      
      // Dashboard Page
      dash_title: "உள்ளூர் காற்றுத் தரம்",
      dash_subtitle: "உணரிகள் கட்டமைப்பு — விவரங்களுக்கு நகர்த்தவும், ஆய்வு செய்ய அழுத்தவும்",
      legend_good: "நல்லது",
      legend_moderate: "மிதமான மாசு",
      legend_unhealthy_sens: "பாதிப்படையக்கூடியவர்களுக்கு ஆரோக்கியமற்றது",
      legend_unhealthy: "ஆரோக்கியமற்றது",
      legend_very_unhealthy: "மிகவும் ஆரோக்கியமற்றது+",
      legend_photo_sat: "புகைப்படம்/செயற்கைக்கோள் மட்டும்",
      dash_selected_cell: "தேர்ந்தெடுக்கப்பட்ட பகுதி",
      dash_forecast_title: "24 மணி நேர முன்னறிவிப்பு",
      dash_ground_sensors: "தரை உணரிகளின் அளவீடுகள்",
      dash_ops_link: "அதிகாரிகள் பணியகத்தைத் திற →",
      last_updated_prefix: "கடைசியாக புதுப்பிக்கப்பட்டது",
      last_updated_suffix: "· மீண்டும் ஏற்றும்போது புதுப்பிக்கப்படும்",
      city_all: "அனைத்து நகரங்களும்",
      city_filter_label: "நகரம்:",
      
      // Report Page
      rep_eyebrow: "குடிமக்கள் புகார்",
      rep_title: "புகை, தூசி அல்லது எரியும் குப்பையைக் கண்டீர்களா? அதை வரைபடத்தில் சேர்க்கவும்.",
      rep_desc: "இருப்பிடத்துடன் கூடிய புகைப்படம் பதிவேற்ற ஒரு நிமிடத்திற்கும் குறைவாகவே ஆகும். இது தரை உணரிகள் மற்றும் செயற்கைக்கோள் தரவுகளுடன் இணைந்து தீவிர மாசுப் பகுதிகளைக் கண்டறிய உதவுகிறது.",
      rep_label_loc: "இருப்பிடம்",
      rep_placeholder_loc: "தெரு, சந்திப்பு அல்லது அருகிலுள்ள அடையாளக் குறி",
      rep_use_loc: "📍 எனது தற்போதைய இருப்பிடத்தைப் பயன்படுத்து",
      rep_label_seeing: "நீங்கள் காண்பது என்ன?",
      rep_label_severity: "மாசு அளவு எவ்வளவு மோசமாக உள்ளது?",
      rep_label_photo: "புகைப்படம்",
      rep_dropzone_main: "புகைப்படத்தை இங்கே இழுத்து விடவும், அல்லது தேர்ந்தெடுக்க அழுத்தவும்",
      rep_dropzone_hint: "JPG அல்லது PNG · இந்த விளக்கத்திற்காக உங்கள் சாதனத்திலேயே இருக்கும்",
      rep_label_notes: "கூடுதல் விவரங்கள் (விருப்பத்தேர்வு)",
      rep_placeholder_notes: "உதாரணமாக: காலை 7 மணிக்குத் தொடங்கியது, நெகிழி எரியும் வாசனை வீசுகிறது, இரண்டு நாட்களாக நீடிக்கிறது",
      rep_label_email: "தகவல்களைப் பெற மின்னஞ்சல் (விருப்பத்தேர்வு)",
      rep_placeholder_email: "you@example.com",
      rep_btn_submit: "புகாரைச் சமர்ப்பி",
      rep_submit_hint: "புகார்கள் நேரலை வரைபடத்தில் காட்டப்படும் அதே மாசு மாதிரியில் சேர்க்கப்படும் — கணக்கு தேவையில்லை.",
      rep_confirm_received: "✓ புகார் பெறப்பட்டது",
      rep_confirm_title: "நன்றி — இது இப்போது வரைபடத்தில் சேர்க்கப்பட்டுள்ளது.",
      rep_confirm_view_map: "நேரலை வரைபடத்தில் பார்க்கவும்",
      rep_intro_note: "புகார்கள் அருகிலுள்ள கண்காணிப்புப் பகுதியுடன் பொருத்தப்படும். ஒரு குறிப்பிட்ட பகுதிக்கு சில மணி நேரங்களில் மூன்று அல்லது அதற்கு மேற்பட்ட புகார்கள் வந்தால், உணரிகள் இல்லாவிட்டாலும் எச்சரிக்கை எழுப்பப்படும்.",
      rep_recent_title: "சமீபத்திய புகார்கள் (இந்த சாதனம்)",
      rep_no_reports: "இன்னும் புகார்கள் எதுவும் சமர்ப்பிக்கப்படவில்லை.",
      
      // Ops Page
      ops_eyebrow: "நகராட்சி அதிகாரிகள் பணியகம்",
      ops_title: "பணி ஒதுக்கீடு வரிசை",
      ops_stat_open: "திறந்த எச்சரிக்கைகள்",
      ops_stat_critical: "தீவிர நிலை",
      ops_stat_dispatched: "அனுப்பப்பட்ட குழுக்கள்",
      ops_stat_resolved: "இன்று தீர்க்கப்பட்டவை",
      ops_alert_queue: "எச்சரிக்கை வரிசை",
      ops_legend_critical: "தீவிரம்",
      ops_legend_warning: "எச்சரிக்கை",
      ops_legend_resolved: "தீர்க்கப்பட்டது",
      ops_resources_title: "வளங்கள் மற்றும் பணியாளர்கள்",
      ops_recent_reports_title: "சமீபத்திய குடிமக்கள் புகார்கள்",
      ops_no_recent_reports: "இன்னும் புகார்கள் ஏதுமில்லை — இந்தச் சாதனத்தில் இருந்து எதுவும் சமர்ப்பிக்கப்படவில்லை.",
      
      // Categories and Labels
      cat_good: "நல்லது",
      cat_moderate: "மிதமான மாசு",
      cat_unhealthy_s: "பாதிப்படையக்கூடியவர்களுக்கு ஆரோக்கியமற்றது",
      cat_unhealthy: "ஆரோக்கியமற்றது",
      cat_very: "மிகவும் ஆரோக்கியமற்றது",
      cat_hazard: "ஆபத்தானது",
      
      source_ground: "தரை உணரி",
      source_photo_sat: "புகைப்படம் + செயற்கைக்கோள் மட்டும்",
      
      type_traffic: "போக்குவரத்து",
      type_industrial: "தொழிற்சாலை",
      type_residential: "குடியிருப்பு",
      type_green: "பசுமை மண்டலம்",
      type_dump: "குப்பைக் கிடங்கு",
      
      chip_smoke: "புகை",
      chip_dust: "தூசி மேகம்",
      chip_burning: "குப்பை எரிப்பு",
      chip_industrial: "தொழிற்சாலை துர்நாற்றம்",
      chip_haze: "தொடர் மூடுபனி",
      
      chip_mild: "குறைவானது",
      chip_noticeable: "கவனிக்கத்தக்கது",
      chip_severe: "கடுமையானது",
      
      status_open: "திறந்துள்ளது",
      status_acknowledged: "ஏற்கப்பட்டது",
      status_dispatched: "அனுப்பப்பட்டது",
      status_resolved: "தீர்க்கப்பட்டது",
      
      // Ops Alerts Dynamic Strings
      alert_open: "எச்சரிக்கை ஏற்கப்பட்டது.",
      alert_resolved: "எச்சரிக்கை தீர்க்கப்பட்டதாகக் குறிக்கப்பட்டது.",
      alert_dispatched: "அனுப்பப்பட்டது.",
      btn_ack: "ஏற்றுக்கொள்",
      btn_resolve: "தீர்க்கப்பட்டதாகக் குறி",
      select_assign: "வளங்களை ஒதுக்கு...",
      predicted_peak: "கணிக்கப்படும் உச்ச அளவு",
      logged_at: "பதிவுசெய்யப்பட்டது",
      assigned: "ஒதுக்கப்பட்டது"
    }
  };

  function t(key) {
    const langDict = dict[currentLang] || dict['en'];
    return langDict[key] || key;
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(LS_LANG, lang);
    translatePage();
    window.dispatchEvent(new CustomEvent('languagechanged', { detail: lang }));
  }

  function getLanguage() {
    return currentLang;
  }

  function translatePage() {
    document.documentElement.setAttribute('lang', currentLang);
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = t(key);
      if (translation !== key) {
        const hasSvg = el.querySelector('svg');
        if (hasSvg) {
          Array.from(el.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
              node.nodeValue = node.nodeValue.startsWith(' ') ? ' ' + translation : translation;
            }
          });
        } else {
          el.textContent = translation;
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translation = t(key);
      if (translation !== key) {
        el.setAttribute('placeholder', translation);
      }
    });

    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = currentLang === 'en' ? 'தமிழ்' : 'English';
      toggleBtn.setAttribute('title', currentLang === 'en' ? 'தமிழ் இணையதளத்திற்கு மாறுக' : 'Switch to English');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'ta' : 'en';
        setLanguage(nextLang);
      });
    }
  });

  return {
    t,
    setLanguage,
    getLanguage,
    translatePage,
    dict
  };
})();
