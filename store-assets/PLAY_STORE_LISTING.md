# Runestone Safari — Google Play Store Listing & Submission Kit

This directory contains the text, graphic assets, and console questionnaire answers required to publish **Runestone Safari** on the Google Play Console.

---

## 1. App Details & Metadata

### App Name / Title (Max 30 characters)
> **Option 1 (Recommended):** `Runestone Safari: Viking Runes` *(30 chars)*  
> **Option 2:** `Runestone Safari` *(16 chars)*  
> **Option 3:** `Runestone Safari - Norse Runes` *(30 chars)*

### Short Description (Max 80 characters)
> **Option 1 (Recommended):**  
> `Explore 6,800+ Viking runestones across Scandinavia with offline maps & guides.` *(79 chars)*
>
> **Option 2:**  
> `Discover 6,800+ Viking runestones with interactive maps, translations & tracks.` *(78 chars)*
>
> **Option 3:**  
> `Your ultimate pocket guide to 6,800+ Scandinavian Viking runestones and history.` *(79 chars)*

---

### Full Description (Max 4,000 characters)

```text
Step back into the Viking Age with Runestone Safari — your ultimate companion for discovering and exploring over 6,800 authentic Viking runestones across Sweden and Scandinavia!

Whether you are an avid hiker, road-tripper, history enthusiast, or runology scholar, Runestone Safari turns the Scandinavian countryside into an open-air museum.

🗺️ INTERACTIVE RUNESTONE MAP
• Explore 6,815+ cataloged runestones with smooth clustering and high-performance vector maps.
• Locate famous runestones, obscure field stones, churchyard monuments, and hidden rock carvings.
• View both historical find sites and current locations (including museum relocations).
• Tap any marker for instant access to signum, dating, transliteration, and imagery.

📖 ANCIENT RUNIC TEXTS & TRANSLATIONS
• Read the original Younger Futhark inscriptions transliterated into Latin characters.
• Study authentic Old Norse readings and transcriptions.
• Learn the meanings behind the carvings with full translations in English and Swedish.
• Discover the master carvers (such as Öpir, Fot, and Åsmund) and understand Viking art styles (Urnes, Ringerike, and more).

🧭 WORKS OFFLINE & OFF THE BEATEN PATH
• Full offline database caching: search and inspect runestones even without cellular reception deep in the Swedish forests.
• Built-in GPS support to show runestones in your immediate vicinity.
• Export waypoints to GPX format with custom chunk sizes — ready to load into Garmin GPS, Komoot, OsmAnd, or your favorite outdoor navigation app.

⚔️ TRACK YOUR VIKING EXPEDITIONS
• Create a free profile to track your adventures.
• Mark runestones as visited and build your personal expedition log.
• View your progress, visit counts, and export your personal visited list to GPX.
• Optional account sync: you can use 100% of the map, search, and data without ever signing in!

🔍 POWERFUL SEARCH & FILTERS
• Search by official signum (e.g., U 160, Sö 101, Ög 136).
• Filter by parish, municipality, region, carver, or historical period.
• Identify lost stones, ornamental stones, and preserved monuments.

🏛️ TRUSTED ACADEMIC DATA
Runestone Safari builds upon verified, peer-reviewed runological research:
• Data based on the Scandinavian Runic-text Database (Samnordisk runtextdatabas) from Uppsala University.
• Powered by OpenFreeMap vector tiles for privacy-friendly, crisp cartography.
• Free and open-source software (GPLv3).

Start your expedition today and uncover the messages carved by the Vikings over a thousand years ago!
```

---

## 2. Store Assets in this Directory

| Asset File | Google Play Requirement | Status |
| :--- | :--- | :--- |
| `icon-512x512.png` | 512 x 512 px, 32-bit PNG | ✅ Ready (High-res Swedish heritage logo) |
| `feature-graphic-1024x500.jpg` | 1024 x 500 px, JPG or 24-bit PNG (no alpha) | ✅ Ready (Viking runestone in Nordic nature with map overlays) |
| `screenshot-1-interactive-map.png` | Min 320px, Max 3840px, 16:9 / 2:1 ratio | ✅ Ready (Clustered map of 6,800+ runestones) |
| `screenshot-2-runestone-preview.png` | Phone screenshot | ✅ Ready (Täby runestone quick preview card) |
| `screenshot-3-runestone-details.png` | Phone screenshot | ✅ Ready (Full Norse text, English & Swedish translations) |
| `screenshot-4-search-and-filters.png` | Phone screenshot | ✅ Ready (Search by signum, carver, region) |
| `screenshot-5-profile-and-gpx-export.png` | Phone screenshot | ✅ Ready (Visited log & GPX hiking export) |

---

## 3. Categorization & Contact Details

- **Application type:** App
- **Primary Category:** `Education` or `Travel & Local`
- **Tags (Select up to 5 in Google Play Console):**
  - `Education`
  - `Travel & local`
  - `Maps & navigation`
  - `History`
  - `Reference`
- **Developer / Organization:** `Dennis Filonoff` / `norr.dev`
- **Contact Email:** `privacy.runestonesafari.1atjf@simplelogin.com`
- **Website:** `https://runestonesafari.com/`
- **Privacy Policy URL:** `https://runestonesafari.com/privacy`

---

## 4. Google Play Console Policy Questionnaires

### App Access
- **Option to select:** *All functionality is available without special access restrictions.*
  *(Note: Visiting tracking has optional sign-in, but the entire app, map, search, and translations are fully functional without login).*

### Ads
- **Option to select:** *No, my app does not contain ads.*

### Content Rating (IARC)
- **Category:** Reference, News, or Educational
- **Violence:** No
- **Sexuality:** No
- **Profanity:** No
- **Controlled Substances:** No
- **User-generated Content / Social Features:** No public forums or open chat.
- **Physical Location Sharing:** No (location is displayed locally on map only).
- **Resulting Rating:** `PEGI 3` / `Everyone`

### Target Audience & Content
- **Target Age:** `13-15`, `16-17`, `18 and over` (Selecting 13+ prevents requiring Google Designed for Families compliance).
- **Could the app appeal to children?** No.

### Data Safety Form
- **Does your app collect or share user data?** Yes (minimal, transparent).
- **Data Encrypted in transit?** Yes (all network traffic is HTTPS/TLS).
- **Do you provide a way for users to request data deletion?** Yes (in-app button on the Profile screen, or via email).

#### Specific Data Types:
1. **Location:**
   - *Approximate location & Precise location*
   - Collected: Yes (when user centers map on current location).
   - Ephemeral: Yes (used strictly on-device in real-time, not stored on remote servers).
   - Shared with third parties: No.
   - Purpose: App functionality.
2. **Personal Info:**
   - *Email address*
   - Collected: Optional (only if user registers an account to sync visited stones).
   - Shared with third parties: No.
   - Purpose: Account management / App functionality.
3. **No financial info, health info, photos, contacts, SMS, or advertising IDs collected.**

---

## 5. Building & Uploading the Release

To generate the signed Android App Bundle (AAB) for upload:

```bash
npm run android:release:aab
```

The output bundle will be located at:
`src-tauri/gen/android/app/build/outputs/bundle/release/app-universal-release.aab`
