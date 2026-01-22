// content.js - Lock screen overlay for missed prayers

// === TRACK LOCK STATE ===
let lockActive = false;
let currentPrayer = '';

// === INJECT STYLES ===
const styles = `
    #prayer-lock-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
        from { 
            opacity: 0; 
        }
        to { 
            opacity: 1; 
        }
    }
    
    .lock-content {
        background: white;
        padding: 50px 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    
    .lock-content h1 {
        color: #00a896;
        margin-bottom: 20px;
        font-size: 28px;
        font-weight: 600;
    }
    
    .lock-content p {
        font-size: 18px;
        color: #333;
        margin-bottom: 10px;
    }
    
    .lock-content button {
        padding: 15px 40px;
        background: #00a896;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 168, 150, 0.3);
    }
    
    .lock-content button:hover {
        background: #008876;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 168, 150, 0.4);
    }
    
    .lock-content button:active {
        transform: translateY(0);
    }
    
    .reminder-text {
        margin-top: 20px;
        color: #666;
        font-style: italic;
        font-size: 14px;
    }
`;

// Create and inject style element
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
styleSheet.id = 'prayer-lock-styles';

// Inject when head is available
if (document.head) {
    document.head.appendChild(styleSheet);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(styleSheet);
    });
}

// === CORE FUNCTIONS ===

/**
 * Creates the lock screen overlay
 * @param {string} prayerName - Name of the prayer (e.g., "Fajr", "Dhuhr")
 */
function createLockScreen(prayerName) {
    // Don't create multiple overlays
    if (document.getElementById('prayer-lock-screen')) {
        return;
    }
    
    // Update state
    lockActive = true;
    currentPrayer = prayerName;
    
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.id = 'prayer-lock-screen';
    
    // Add content
    overlay.innerHTML = `
        <div class="lock-content">
            <h1>🕌 Prayer Time Reminder</h1>
            <p>You have not confirmed <strong>${prayerName}</strong> prayer</p>
            <button id="confirm-prayer-lock">I Have Prayed</button>
            <p class="reminder-text">Prayer is better than sleep</p>
        </div>
    `;
    
    // Prevent right-click on overlay
    overlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Prevent scrolling on the page
    document.body.style.overflow = 'hidden';
    
    // Append to body
    document.body.appendChild(overlay);
    
    // Add event listener to button
    const confirmButton = document.getElementById('confirm-prayer-lock');
    if (confirmButton) {
        confirmButton.addEventListener('click', handlePrayerConfirmation);
    }
    
    console.log(`Lock screen created for ${prayerName} prayer`);
}

/**
 * Removes the lock screen overlay
 */
function removeLockScreen() {
    const overlay = document.getElementById('prayer-lock-screen');
    if (overlay) {
        overlay.remove();
        console.log('Lock screen removed');
    }
    
    // Restore scrolling
    document.body.style.overflow = '';
    
    // Update state
    lockActive = false;
    currentPrayer = '';
}

/**
 * Handles prayer confirmation button click
 */
function handlePrayerConfirmation() {
    console.log('Prayer confirmed by user');
    
    // Send message to background script
    chrome.runtime.sendMessage({
        action: 'prayerConfirmed',
        prayerName: currentPrayer,
        timestamp: Date.now()
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending confirmation:', chrome.runtime.lastError);
        }
    });
    
    // Remove the lock screen
    removeLockScreen();
}

// === MESSAGE LISTENER ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.action === 'lockScreen') {
        createLockScreen(message.prayerName);
        sendResponse({ success: true });
    } else if (message.action === 'unlockScreen') {
        removeLockScreen();
        sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
});

// === SECURITY MEASURES ===

/**
 * Prevent keyboard shortcuts that could close the lock screen
 */
document.addEventListener('keydown', (e) => {
    if (document.getElementById('prayer-lock-screen')) {
        // Block common shortcuts
        if (
            e.key === 'Escape' || 
            e.key === 'F5' ||  // Prevent refresh
            (e.ctrlKey && e.key === 'r') ||  // Prevent reload
            (e.ctrlKey && e.key === 'R') ||
            (e.ctrlKey && e.key === 'w') ||  // Prevent close tab
            (e.ctrlKey && e.key === 'W') ||
            (e.altKey && e.key === 'F4') ||  // Prevent close window
            (e.metaKey && e.key === 'w') ||  // Mac close tab
            (e.metaKey && e.key === 'W')
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
});

/**
 * Re-inject lock screen if user tries to remove it via DevTools
 */
function startMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        // Check if lock screen was removed
        if (lockActive && !document.getElementById('prayer-lock-screen')) {
            console.log('Lock screen was removed, re-creating...');
            createLockScreen(currentPrayer);
        }
    });
    
    if (document.body) {
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }
}

// Start observer when DOM is ready
if (document.body) {
    startMutationObserver();
} else {
    document.addEventListener('DOMContentLoaded', startMutationObserver);
}

// === CHECK LOCK STATUS ON PAGE LOAD ===
/**
 * When page loads, check if lock screen should already be active
 */
function checkInitialLockStatus() {
    chrome.runtime.sendMessage({ action: 'checkLockStatus' }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('Background script not ready yet:', chrome.runtime.lastError.message);
            return;
        }
        
        if (response && response.locked) {
            console.log('Lock should be active on page load');
            createLockScreen(response.prayerName);
        }
    });
}

// Check immediately if possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkInitialLockStatus);
} else {
    checkInitialLockStatus();
}

console.log('Prayer reminder content script loaded');