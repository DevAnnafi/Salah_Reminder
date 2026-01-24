# Salah Reminder Chrome Extension - Installation Guide

## Loading the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or click the menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `/Users/zihan/Salah_Reminder` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Salah_Reminder" and click the pin icon
   - This makes it easily accessible

## First-Time Setup

1. **Click the Extension Icon**
   - Click the Salah Reminder icon in your toolbar
   - The popup will appear

2. **Configure Settings**
   - Click the gear (⚙️) icon in the popup
   - Enter your location (e.g., "New York, NY" or "London, UK")
   - Select your calculation method (default: ISNA)
   - Set grace period (default: 15 minutes)
   - Enable/disable screen lock feature
   - Click "Save Settings"

3. **Verify Prayer Times**
   - After saving, prayer times should load automatically
   - You'll see the 5 daily prayers with times
   - The next prayer countdown will appear

## Testing the Extension

### Test 1: Prayer Times Display
- Open the extension popup
- Verify that all 5 prayer times are displayed
- Check that the Islamic date is showing
- Confirm the next prayer countdown is working

### Test 2: Prayer Confirmation
- Click "I Have Prayed" button in the popup
- The current/next prayer should show a ✅ checkmark
- The prayer status should persist when reopening the popup

### Test 3: Lock Screen Feature
To test the lock screen, you have two options:

**Option A: Wait for a prayer time** (Real-world test)
- Wait for the next prayer time to arrive
- After the grace period (default 15 min), the lock screen should appear on all browser tabs
- Click "I Have Prayed" to dismiss it

**Option B: Manual testing** (Quick test)
- Open Chrome DevTools (F12)
- Go to Console tab
- Test the lock screen by running:
  ```javascript
  // Manually trigger lock screen
  chrome.runtime.sendMessage({action: 'lockScreen', prayerName: 'Test'});
  ```

### Test 4: Notifications
- You should receive browser notifications at:
  - First installation (welcome message)
  - When prayer times are updated
  - At each prayer time

## Troubleshooting

### Prayer times not loading
- Check your internet connection
- Verify the location is entered correctly (City, Country format)
- Open Chrome DevTools and check Console for errors
- Try a different calculation method in settings

### Lock screen not appearing
- Check that "Enable screen lock" is checked in settings
- Verify content script is loaded: DevTools → Sources → Content Scripts
- Check background service worker logs: `chrome://extensions/` → Details → Inspect views: service worker

### Icons not showing
- Refresh the extension: Toggle it off and on in `chrome://extensions/`
- Reload the extension: Click the refresh icon on the extension card

## Features Overview

### Core Features
✅ Automatic prayer time fetching based on location  
✅ 5 daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha)  
✅ Islamic & Gregorian date display  
✅ Next prayer countdown timer  
✅ Prayer confirmation tracking  
✅ Browser notifications at prayer times  
✅ Lock screen for missed prayers  
✅ Configurable grace period  
✅ Multiple calculation methods  
✅ Automatic midnight reset  

### Keyboard Shortcuts
- `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac): Confirm prayer completion
- `Alt+P`: Open prayer times popup

## Development Notes

### File Structure
```
Salah_Reminder/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (prayer alarms, notifications)
├── popup.html/js/css     # Extension popup interface
├── content.js            # Lock screen injection
├── api.js                # Prayer times API wrapper
├── icons/                # Extension icons
└── styles.css            # Popup styling
```

### API Used
- **Aladhan API**: https://api.aladhan.com/v1
- Free, no authentication required
- Provides Islamic prayer times worldwide

### Storage Structure
The extension uses Chrome's local storage:
- `userLocation`: City and country
- `calculationMethod`: Islamic calculation method
- `gracePeriod`: Minutes before lock screen
- `lockEnabled`: Boolean for lock feature
- `prayerTimes`: Today's prayer times
- `prayerStatus`: Which prayers are confirmed
- `dateInfo`: Hijri and Gregorian dates

## Support

If you encounter any issues:
1. Check the Console for errors (F12 → Console)
2. Check the Background Service Worker logs
3. Verify all files are present in the extension folder
4. Try reloading the extension

## Privacy

This extension:
- ✅ Only accesses prayer times API (aladhan.com)
- ✅ Stores settings locally on your device
- ✅ Does not collect or transmit personal data
- ✅ Works offline after initial prayer times fetch
