# Salah_Reminder
# Muslim Prayer Reminder - Chrome Extension

A Chrome extension that helps Muslims stay consistent with their daily prayers by providing timely reminders and gentle accountability through screen locking for missed prayers.

## 🕌 Features

- **Automatic Prayer Time Calculation**: Calculates accurate prayer times based on your location
- **Smart Notifications**: Receive notifications at each prayer time (Fajr, Dhuhr, Asr, Maghrib, Isha)
- **Screen Lock**: Browser screen locks if prayers are not confirmed within the grace period
- **Prayer Confirmation**: Simple interface to confirm completed prayers
- **Customizable Settings**:
  - Multiple calculation methods (ISNA, MWL, Umm Al-Qura, etc.)
  - Adjustable grace periods
  - Location settings
- **Daily Reset**: Prayer tracking resets automatically each day
- **Offline Support**: Works without constant internet connection once prayer times are calculated

## 📋 Prerequisites

- Google Chrome browser (version 88 or higher)
- Basic understanding of your location or coordinates
- Manifest V3 knowledge for development

## 🚀 Installation

### For Users
1. Download the latest release from the releases page
2. Extract the ZIP file to a folder
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the extracted folder
7. The extension icon should appear in your toolbar

### For Developers
```bash
# Clone the repository
git clone https://github.com/DevAnnafi/Salah_Reminder.git

# Navigate to the project directory
cd Salah_Reminder

# Load the extension in Chrome as described above
```

## 📁 Project Structure

```
prayer-reminder/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for alarms and prayer logic
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── content.js             # Injected script for lock screen
├── lock-screen.html       # Lock screen overlay template
├── styles.css             # Styling for popup and lock screen
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🛠️ Development Setup

### Required Permissions
The extension requires the following Chrome permissions:
- `alarms` - Schedule prayer time reminders
- `notifications` - Display prayer notifications
- `storage` - Save user preferences and prayer confirmations
- `activeTab` - Access current tab for lock screen
- `scripting` - Inject lock screen overlay
- `geolocation` (optional) - Auto-detect location

### Core Technologies
- **Manifest V3** - Latest Chrome extension standard
- **Chrome APIs**: alarms, notifications, storage, scripting
- **Prayer Time Calculation**: Choose one:
  - [Aladhan API](https://aladhan.com/prayer-times-api) (recommended for beginners)
  - [adhan-js](https://github.com/batoulapps/adhan-js) library
  - [PrayTimes.js](http://praytimes.org/code/) library

## 💻 Key Components

### 1. Background Service Worker (`background.js`)
- Fetches and calculates daily prayer times
- Sets up alarms for each prayer
- Monitors prayer confirmations
- Triggers lock screen for missed prayers
- Handles daily reset at midnight

### 2. Popup Interface (`popup.html`, `popup.js`)
- Display today's prayer times
- Show prayer completion status
- Manual prayer confirmation buttons
- Settings configuration
- Location input

### 3. Content Script (`content.js`)
- Injects lock screen overlay into active tabs
- Blocks user interaction until prayer is confirmed
- Communicates with background script
- Persists across page navigation

### 4. Lock Screen (`lock-screen.html`)
- Full-page overlay UI
- Prayer confirmation button
- Displays which prayer was missed
- Emergency disable option

## ⚙️ Configuration Options

Users can customize:
- **Calculation Method**: ISNA, MWL, Egyptian, Karachi, Umm Al-Qura, etc.
- **Grace Period**: Time allowed after adhan before lock activates (5-60 minutes)
- **Location**: City name, coordinates, or auto-detect
- **Notifications**: Enable/disable for specific prayers
- **Lock Screen**: Enable/disable the lock feature entirely

## 🔧 Technical Implementation Notes

### Prayer Time Calculation
```javascript
// Example using Aladhan API
const response = await fetch(
  `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`
);
```

### Alarm Setup
```javascript
// Set alarm for each prayer
chrome.alarms.create('fajr', {
  when: fajrTime.getTime()
});
```

### Lock Screen Activation
```javascript
// Inject content script to all tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  });
});
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Test thoroughly before submitting
- Update documentation as needed
- Ensure Manifest V3 compatibility
- Consider performance implications

## 📝 Roadmap

- [ ] Qibla direction finder
- [ ] Prayer counter/streak tracking
- [ ] Ramadan mode with Suhoor/Iftar times
- [ ] Multiple location support
- [ ] Prayer time adjustments
- [ ] Integration with Islamic calendar
- [ ] Athkar (remembrance) reminders
- [ ] Dark mode
- [ ] Multi-language support

## ⚠️ Important Notes

- This extension is a **voluntary accountability tool**, not a restriction
- Users can disable the extension at any time through Chrome settings
- The lock screen is meant to encourage prayer, not force it
- Prayer times are calculated based on astronomical data and your chosen method
- Always verify prayer times with your local mosque

## 🔒 Privacy

- All data is stored locally on your device
- No personal information is collected or transmitted
- Location data is only used for prayer time calculation
- No analytics or tracking

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Prayer time calculation methods from various Islamic organizations
- Muslim community for feedback and suggestions
- Aladhan API for providing free prayer time data

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: islamannafi@gmail.com
- Community discussions in the Discussions tab

## 🌟 May Allah accept our prayers

This extension is created to help Muslims maintain their connection with Allah through consistent prayer. May it be a means of benefit and a continuous charity (sadaqah jariyah) for all who contribute to it.

---

**Note**: This is a tool for personal accountability. The developers are not responsible for any prayer times that may be inaccurate. Always verify with your local mosque and use your best judgment.
