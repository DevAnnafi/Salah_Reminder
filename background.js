// background.js - Service worker for prayer reminder extension

// Import API functions (if using modules, otherwise they're global)
importScripts('api.js');

// === STATE VARIABLES ===
// Track current state

// background.js - Service worker for Muslim Prayer Reminder extension

// === STATE VARIABLES ===
let currentPrayer = null;      // Currently active/missed prayer
let lockActive = false;        // Is lock screen currently showing
let gracePeriodTimer = null;   // Timer for grace period before locking

// === INITIALIZATION ===
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First time installation - set default settings
        await chrome.storage.local.set({
            calculationMethod: 2,        // ISNA
            gracePeriod: 15,             // 15 minutes
            lockEnabled: true,           // Lock screen enabled
            prayerStatus: {
                Fajr: false,
                Dhuhr: false,
                Asr: false,
                Maghrib: false,
                Isha: false
            }
        });
        
        console.log('Default settings initialized');
        
        // Show welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '🕌 Welcome to Muslim Prayer Reminder',
            message: 'Please set your location in the settings to get started.',
            priority: 2
        });
    }
    
    // Set up midnight reset alarm
    setMidnightAlarm();
    
    // Fetch prayer times if location is already set
    const settings = await chrome.storage.local.get(['userLocation']);
    if (settings.userLocation) {
        fetchAndStorePrayerTimes();
    }
});

// === CORE FUNCTION: FETCH AND STORE PRAYER TIMES ===
async function fetchAndStorePrayerTimes() {
    console.log('Fetching prayer times...');
    
    try {
        // Get user settings
        const settings = await chrome.storage.local.get([
            'userLocation',
            'calculationMethod'
        ]);
        
        // Check if location is set
        if (!settings.userLocation) {
            console.log('No location set - cannot fetch prayer times');
            return;
        }
        
        // Parse location
        const { city, country } = parseLocation(settings.userLocation);
        const method = settings.calculationMethod || 2;
        
        console.log(`Fetching prayer times for ${city}, ${country} using method ${method}`);
        
        // Call API
        const data = await getPrayerTimesByCity(city, country, method);
        
        // Extract prayer times and date info
        const prayerTimes = extractPrayerTimes(data);
        const dateInfo = extractDateInfo(data);
        
        console.log('Prayer times fetched:', prayerTimes);
        
        // Save to storage
        await chrome.storage.local.set({
            prayerTimes: prayerTimes,
            dateInfo: dateInfo,
            lastUpdated: Date.now()
        });
        
        // Initialize prayer status for today (all false)
        await chrome.storage.local.set({
            prayerStatus: {
                Fajr: false,
                Dhuhr: false,
                Asr: false,
                Maghrib: false,
                Isha: false
            }
        });
        
        // Set alarms for each prayer
        await setPrayerAlarms(prayerTimes);
        
        console.log('Prayer times updated successfully');
        
        // Show success notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '✅ Prayer Times Updated',
            message: `Prayer times set for ${city}, ${country}`,
            priority: 1
        });
        
    } catch (error) {
        console.error('Failed to fetch prayer times:', error);
        
        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '❌ Prayer Times Error',
            message: 'Could not fetch prayer times. Please check your location.',
            priority: 2
        });
    }
}

// === SET ALARMS FOR EACH PRAYER ===
async function setPrayerAlarms(prayerTimes) {
    console.log('Setting prayer alarms...');
    
    // Clear all existing prayer alarms
    const alarms = await chrome.alarms.getAll();
    for (const alarm of alarms) {
        if (alarm.name.startsWith('prayer-')) {
            await chrome.alarms.clear(alarm.name);
        }
    }
    
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    
    for (const prayerName of prayers) {
        const prayerTime = prayerTimes[prayerName];
        if (!prayerTime) continue;
        
        // Parse time (format: "HH:MM" or "HH:MM (TZ)")
        const timeStr = prayerTime.split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Create Date object for this prayer time today
        const alarmTime = new Date();
        alarmTime.setHours(hours, minutes, 0, 0);
        
        // Only set alarm if time hasn't passed yet today
        if (alarmTime > now) {
            await chrome.alarms.create(`prayer-${prayerName}`, {
                when: alarmTime.getTime()
            });
            console.log(`Alarm set for ${prayerName} at ${timeStr}`);
        } else {
            console.log(`${prayerName} time has already passed today`);
        }
    }
}

// === HANDLE ALARM FIRING ===
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm fired:', alarm.name);
    
    if (alarm.name.startsWith('prayer-')) {
        // Prayer time alarm
        const prayerName = alarm.name.replace('prayer-', '');
        handlePrayerTime(prayerName);
    } else if (alarm.name === 'midnight-reset') {
        // Midnight reset alarm
        handleMidnightReset();
    }
});

// === HANDLE PRAYER TIME ===
async function handlePrayerTime(prayerName) {
    console.log(`${prayerName} prayer time!`);
    
    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `🕌 ${prayerName} Prayer Time`,
        message: `It's time for ${prayerName} prayer. May Allah accept your prayer.`,
        priority: 2
    });
    
    // Set current prayer
    currentPrayer = prayerName;
    
    // Get settings
    const settings = await chrome.storage.local.get(['lockEnabled', 'gracePeriod']);
    
    if (!settings.lockEnabled) {
        console.log('Lock screen is disabled');
        return;
    }
    
    // Start grace period timer
    const graceMinutes = settings.gracePeriod || 15;
    console.log(`Starting grace period: ${graceMinutes} minutes`);
    
    // Clear any existing timer
    if (gracePeriodTimer) {
        clearTimeout(gracePeriodTimer);
    }
    
    // Set new timer
    gracePeriodTimer = setTimeout(() => {
        checkPrayerConfirmation(prayerName);
    }, graceMinutes * 60 * 1000); // Convert minutes to milliseconds
}

// === CHECK IF PRAYER WAS CONFIRMED ===
async function checkPrayerConfirmation(prayerName) {
    console.log(`Grace period ended for ${prayerName}, checking confirmation...`);
    
    // Get prayer status
    const data = await chrome.storage.local.get(['prayerStatus']);
    const prayerStatus = data.prayerStatus || {};
    
    // Check if this prayer was confirmed
    if (prayerStatus[prayerName]) {
        console.log(`${prayerName} was confirmed - no lock needed`);
        return;
    }
    
    // Prayer not confirmed - trigger lock screen
    console.log(`${prayerName} not confirmed - triggering lock screen`);
    triggerLockScreen(prayerName);
}

// === TRIGGER LOCK SCREEN ON ALL TABS ===
async function triggerLockScreen(prayerName) {
    console.log(`Activating lock screen for ${prayerName}`);
    
    // Set lock state
    lockActive = true;
    currentPrayer = prayerName;
    
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    console.log(`Sending lock message to ${tabs.length} tabs`);
    
    // Send lock message to each tab
    for (const tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'lockScreen',
                prayerName: prayerName
            });
        } catch (error) {
            // Some tabs can't receive messages (chrome:// pages, etc.)
            // This is expected and not an error
        }
    }
}

// === UNLOCK SCREEN ON ALL TABS ===
async function unlockScreen() {
    console.log('Unlocking screen...');
    
    // Reset lock state
    lockActive = false;
    currentPrayer = null;
    
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Send unlock message to each tab
    for (const tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'unlockScreen'
            });
        } catch (error) {
            // Ignore errors from tabs that can't receive messages
        }
    }
}

// === CONFIRM PRAYER ===
async function confirmPrayer(prayerName) {
    if (!prayerName) {
        console.log('No prayer name provided for confirmation');
        return;
    }
    
    console.log(`Confirming ${prayerName} prayer`);
    
    // Get current prayer status
    const data = await chrome.storage.local.get(['prayerStatus']);
    const prayerStatus = data.prayerStatus || {};
    
    // Mark this prayer as confirmed
    prayerStatus[prayerName] = true;
    
    // Save back to storage
    await chrome.storage.local.set({ prayerStatus: prayerStatus });
    
    // Clear grace period timer if still running
    if (gracePeriodTimer) {
        clearTimeout(gracePeriodTimer);
        gracePeriodTimer = null;
    }
    
    // If lock is active, unlock it
    if (lockActive) {
        unlockScreen();
    }
    
    // Reset current prayer
    if (currentPrayer === prayerName) {
        currentPrayer = null;
    }
    
    console.log(`${prayerName} confirmed successfully`);
}

// === HANDLE MESSAGES FROM POPUP AND CONTENT SCRIPTS ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message.action);
    
    if (message.action === 'updatePrayerTimes') {
        // User changed location - fetch new prayer times
        fetchAndStorePrayerTimes().then(() => {
            sendResponse({ success: true });
        });
        return true; // Keep message channel open for async response
    }
    
    else if (message.action === 'confirmCurrentPrayer') {
        // User clicked "I Have Prayed" in popup
        if (currentPrayer) {
            confirmPrayer(currentPrayer).then(() => {
                sendResponse({ success: true });
            });
        } else {
            sendResponse({ success: false, error: 'No current prayer' });
        }
        return true;
    }
    
    else if (message.action === 'prayerConfirmed') {
        // User confirmed from lock screen
        const prayerName = message.prayerName || currentPrayer;
        confirmPrayer(prayerName).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    else if (message.action === 'checkLockStatus') {
        // Content script checking if lock should be active
        sendResponse({
            locked: lockActive,
            prayerName: currentPrayer
        });
        return false; // Synchronous response
    }
    
    return false;
});

// === SET MIDNIGHT RESET ALARM ===
function setMidnightAlarm() {
    // Calculate time until next midnight
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    
    // Create alarm for midnight
    chrome.alarms.create('midnight-reset', {
        when: midnight.getTime(),
        periodInMinutes: 1440 // Repeat every 24 hours
    });
    
    console.log('Midnight reset alarm set');
}

// === HANDLE MIDNIGHT RESET ===
async function handleMidnightReset() {
    console.log('Midnight reset - new day!');
    
    // Reset all prayer statuses
    await chrome.storage.local.set({
        prayerStatus: {
            Fajr: false,
            Dhuhr: false,
            Asr: false,
            Maghrib: false,
            Isha: false
        }
    });
    
    // Fetch new prayer times for the new day
    fetchAndStorePrayerTimes();
    
    // Clear any active lock
    if (lockActive) {
        unlockScreen();
    }
    
    console.log('Midnight reset complete');
}

// === LISTEN FOR NEW TABS (to apply lock if active) ===
chrome.tabs.onCreated.addListener(async (tab) => {
    if (lockActive && currentPrayer) {
        // Wait a moment for tab to load
        setTimeout(async () => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'lockScreen',
                    prayerName: currentPrayer
                });
            } catch (error) {
                // Tab might not be ready yet or can't receive messages
            }
        }, 1000);
    }
});

console.log('Background service worker initialized');

