// popup.js - Makes the popup interactive

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // === DOM ELEMENTS ===
    const elements = {
        // Location and dates
        userLocation: document.getElementById('user-location'),
        gregorianDate: document.getElementById('gregorian-date'),
        islamicDate: document.getElementById('islamic-date'),
        
        // Next prayer
        nextPrayerName: document.getElementById('next-prayer-name'),
        countdownTimer: document.getElementById('countdown-timer'),
        
        // Prayer times
        fajrTime: document.getElementById('fajr-time'),
        dhuhrTime: document.getElementById('dhuhr-time'),
        asrTime: document.getElementById('asr-time'),
        maghribTime: document.getElementById('maghrib-time'),
        ishaTime: document.getElementById('isha-time'),
        
        // Prayer status icons
        fajrStatus: document.getElementById('fajr-status'),
        dhuhrStatus: document.getElementById('dhuhr-status'),
        asrStatus: document.getElementById('asr-status'),
        maghribStatus: document.getElementById('maghrib-status'),
        ishaStatus: document.getElementById('isha-status'),
        
        // Buttons
        confirmPrayerBtn: document.getElementById('confirm-prayer-btn'),
        openSettingsBtn: document.getElementById('open-settings'),
        saveSettingsBtn: document.getElementById('save-settings'),
        closeSettingsBtn: document.getElementById('close-settings'),
        
        // Settings panel and inputs
        settingsPanel: document.getElementById('settings-panel'),
        cityInput: document.getElementById('city-input'),
        calculationMethod: document.getElementById('calculation-method'),
        gracePeriod: document.getElementById('grace-period'),
        enableLock: document.getElementById('enable-lock')
    };

    // Track countdown interval to prevent duplicates
    let countdownInterval = null;

    // === CORE FUNCTIONS ===

    /**
     * Load all data from chrome storage
     */
    function loadDataFromStorage() {
        chrome.storage.local.get([
            'userLocation',
            'prayerTimes',
            'prayerStatus',
            'calculationMethod',
            'gracePeriod',
            'lockEnabled',
            'dateInfo'
        ], (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading data:', chrome.runtime.lastError);
                return;
            }
            updateUI(data);
        });
    }

    /**
     * Update all UI elements with loaded data
     */
    function updateUI(data) {
        console.log('Updating UI with data:', data);
        
        // Update location
        if (data.userLocation) {
            const locationText = elements.userLocation.querySelector('.text');
            if (locationText) {
                locationText.textContent = data.userLocation;
            }
        } else {
            // Show helpful message when no location is set
            const locationText = elements.userLocation.querySelector('.text');
            if (locationText) {
                locationText.textContent = 'Click ⚙️ to set your location';
            }
        }
        
        // Update dates
        updateDates(data.dateInfo);
        
        // Update prayer times
        if (data.prayerTimes) {
            updatePrayerTimes(data.prayerTimes);
        }
        
        // Update prayer status
        if (data.prayerStatus) {
            updatePrayerStatus(data.prayerStatus);
        }
        
        // Update settings form
        if (data.calculationMethod) {
            elements.calculationMethod.value = data.calculationMethod;
        }
        if (data.gracePeriod !== undefined) {
            elements.gracePeriod.value = data.gracePeriod;
        }
        if (data.lockEnabled !== undefined) {
            elements.enableLock.checked = data.lockEnabled;
        }
        
        // Calculate next prayer
        calculateNextPrayer(data.prayerTimes, data.prayerStatus);
    }

    /**
     * Update prayer times display
     */
    function updatePrayerTimes(times) {
        elements.fajrTime.textContent = times.Fajr || '--:--';
        elements.dhuhrTime.textContent = times.Dhuhr || '--:--';
        elements.asrTime.textContent = times.Asr || '--:--';
        elements.maghribTime.textContent = times.Maghrib || '--:--';
        elements.ishaTime.textContent = times.Isha || '--:--';
    }

    /**
     * Update prayer status icons and styles
     */
    function updatePrayerStatus(status) {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        prayers.forEach(prayer => {
            const prayerCapitalized = prayer.charAt(0).toUpperCase() + prayer.slice(1);
            const statusElement = elements[`${prayer}Status`];
            const prayerItem = statusElement.closest('.prayer-item');
            
            if (status[prayerCapitalized]) {
                // Prayer is confirmed
                statusElement.textContent = '✅';
                prayerItem.classList.add('completed');
                prayerItem.classList.remove('current', 'missed');
            } else {
                // Prayer not confirmed
                statusElement.textContent = '⏰';
                prayerItem.classList.remove('completed');
            }
        });
    }

    /**
     * Update date displays
     */
    function updateDates(dateInfo) {
        // Gregorian date
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        elements.gregorianDate.textContent = today.toLocaleDateString('en-US', options);
        
        // Islamic date from API if available
        if (dateInfo && dateInfo.hijri) {
            const hijri = dateInfo.hijri;
            elements.islamicDate.textContent = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
        } else {
            // Check if location is set
            chrome.storage.local.get(['userLocation'], (data) => {
                if (!data.userLocation) {
                    elements.islamicDate.textContent = 'Set location to view Islamic date';
                } else {
                    elements.islamicDate.textContent = 'Loading Islamic date...';
                }
            });
        }
    }

    /**
     * Calculate and display next prayer
     */
    function calculateNextPrayer(times, status) {
        if (!times) {
            elements.nextPrayerName.textContent = '--';
            elements.countdownTimer.textContent = '--';
            return;
        }
        
        const now = new Date();
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        
        // Find next prayer
        for (let prayer of prayers) {
            const prayerTime = times[prayer];
            if (!prayerTime) continue;
            
            // Parse prayer time (format: "HH:MM" or "HH:MM (timezone)")
            const timeStr = prayerTime.split(' ')[0]; // Remove timezone if present
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);
            
            // Check if this prayer is in the future
            if (prayerDate > now) {
                elements.nextPrayerName.textContent = prayer;
                
                // Highlight current prayer in the list
                highlightCurrentPrayer(prayer);
                
                startCountdown(prayerDate);
                return;
            }
        }
        
        // If no prayer found today, next is tomorrow's Fajr
        elements.nextPrayerName.textContent = 'Fajr (Tomorrow)';
        elements.countdownTimer.textContent = 'New day soon';
    }

    /**
     * Highlight the current/next prayer in the list
     */
    function highlightCurrentPrayer(prayerName) {
        // Remove current class from all prayers
        document.querySelectorAll('.prayer-item').forEach(item => {
            item.classList.remove('current');
        });
        
        // Add current class to the next prayer
        const prayerItem = document.querySelector(`[data-prayer="${prayerName.toLowerCase()}"]`);
        if (prayerItem && !prayerItem.classList.contains('completed')) {
            prayerItem.classList.add('current');
        }
    }

    /**
     * Start countdown timer to next prayer
     */
    function startCountdown(targetTime) {
        // Clear existing interval to prevent duplicates
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        function updateCountdown() {
            const now = new Date();
            const diff = targetTime - now;
            
            if (diff <= 0) {
                elements.countdownTimer.textContent = 'Now!';
                clearInterval(countdownInterval);
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            elements.countdownTimer.textContent = `${hours}h ${minutes}m`;
        }
        
        updateCountdown();
        // Update every minute
        countdownInterval = setInterval(updateCountdown, 60000);
    }

    // === EVENT LISTENERS ===

    /**
     * Open settings panel
     */
    elements.openSettingsBtn.addEventListener('click', () => {
        elements.settingsPanel.style.display = 'block';
        
        // Load current location into input field
        chrome.storage.local.get(['userLocation'], (data) => {
            if (data.userLocation) {
                elements.cityInput.value = data.userLocation;
            }
        });
    });

    /**
     * Close settings panel
     */
    elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsPanel.style.display = 'none';
    });

    /**
     * Save settings
     */
    elements.saveSettingsBtn.addEventListener('click', () => {
        console.log('Save Settings button clicked');
        
        const city = elements.cityInput.value.trim();
        const method = elements.calculationMethod.value;
        const grace = elements.gracePeriod.value;
        const lock = elements.enableLock.checked;
        
        console.log('Settings to save:', { city, method, grace, lock });
        
        // Validation
        if (!city) {
            alert('Please enter a city name');
            return;
        }
        
        // Save to storage
        chrome.storage.local.set({
            userLocation: city,
            calculationMethod: method,
            gracePeriod: parseInt(grace),
            lockEnabled: lock
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
                alert('Failed to save settings');
                return;
            }
            
            console.log('Settings saved successfully');
            
            // Show saving indicator
            elements.saveSettingsBtn.textContent = 'Saving...';
            elements.saveSettingsBtn.disabled = true;
            
            // Notify background script to fetch new prayer times
            chrome.runtime.sendMessage({
                action: 'updatePrayerTimes',
                location: city,
                method: method
            }, (response) => {
                console.log('Background script response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError);
                    alert('Error updating prayer times: ' + chrome.runtime.lastError.message);
                    elements.saveSettingsBtn.textContent = 'Save Settings';
                    elements.saveSettingsBtn.disabled = false;
                    return;
                }
                
                // Close settings panel
                elements.settingsPanel.style.display = 'none';
                
                // Reset button
                elements.saveSettingsBtn.textContent = 'Save Settings';
                elements.saveSettingsBtn.disabled = false;
                
                // Reload data
                setTimeout(() => {
                    loadDataFromStorage();
                }, 2000); // Give background script time to fetch new data
            });
        });
    });

    /**
     * Confirm current prayer button
     */
    elements.confirmPrayerBtn.addEventListener('click', () => {
        console.log('I Have Prayed button clicked');
        
        // Get current prayer times and status to find which prayer to confirm
        chrome.storage.local.get(['prayerTimes', 'prayerStatus'], (data) => {
            const prayerTimes = data.prayerTimes;
            const prayerStatus = data.prayerStatus || {};
            
            if (!prayerTimes) {
                alert('No prayer times available. Please set your location.');
                return;
            }
            
            // Find the most recent prayer that hasn't been confirmed
            const now = new Date();
            const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            let prayerToConfirm = null;
            
            // Check prayers in reverse order to find the most recent one
            for (let i = prayers.length - 1; i >= 0; i--) {
                const prayer = prayers[i];
                const prayerTime = prayerTimes[prayer];
                
                if (!prayerTime) continue;
                
                // Parse prayer time
                const timeStr = prayerTime.split(' ')[0];
                const [hours, minutes] = timeStr.split(':').map(Number);
                const prayerDate = new Date();
                prayerDate.setHours(hours, minutes, 0, 0);
                
                // If this prayer has passed and not confirmed, mark it
                if (prayerDate <= now && !prayerStatus[prayer]) {
                    prayerToConfirm = prayer;
                    break;
                }
            }
            
            if (!prayerToConfirm) {
                alert('No unconfirmed prayers found. All prayers have been confirmed or not yet due.');
                return;
            }
            
            console.log(`Confirming prayer: ${prayerToConfirm}`);
            
            // Send message to background to confirm this prayer
            chrome.runtime.sendMessage({
                action: 'confirmSpecificPrayer',
                prayerName: prayerToConfirm
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error confirming prayer:', chrome.runtime.lastError);
                    alert('Error confirming prayer: ' + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    console.log(`${prayerToConfirm} prayer confirmed successfully`);
                    // Reload UI to show updated status
                    loadDataFromStorage();
                } else {
                    alert(response.error || 'Failed to confirm prayer');
                }
            });
        });
    });

    // === INITIALIZATION ===

    console.log('Popup script loaded');
    console.log('Settings button found:', !!elements.saveSettingsBtn);
    console.log('All required elements found:', {
        cityInput: !!elements.cityInput,
        saveBtn: !!elements.saveSettingsBtn,
        closeBtn: !!elements.closeSettingsBtn,
        settingsPanel: !!elements.settingsPanel
    });
    
    // Load data on popup open
    loadDataFromStorage();

    // Update every minute
    setInterval(() => {
        loadDataFromStorage();
    }, 60000);

});