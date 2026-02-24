// Background service worker for Hyperfunded extension

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // This won't fire when popup is set, but keeping for reference
  showPositionNotification();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPositionNotification') {
    showPositionNotification();
    sendResponse({ success: true });
    return true; // Required for async response
  }
});

// Function to show position notification
function showPositionNotification() {
  console.log('showPositionNotification called');
  
  // Sample position data (in production, this would come from API)
  const position = {
    symbol: 'BTC-PERP',
    type: 'LONG',
    size: '0.15 BTC',
    entry: '$98,450.00',
    mark: '$100,013.33',
    pnl: '+$234.50',
    leverage: '5x',
    pnlPercent: '+1.59%'
  };

  const notificationOptions = {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: `${position.symbol} ${position.type} Position`,
    message: `PnL: ${position.pnl} (${position.pnlPercent})\nSize: ${position.size} at ${position.leverage}\nEntry: ${position.entry} → Mark: ${position.mark}`,
    priority: 2,
    requireInteraction: false
  };

  console.log('Creating notification with options:', notificationOptions);

  chrome.notifications.create('hyperfunded-position', notificationOptions, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Error creating notification:', chrome.runtime.lastError);
      return;
    }
    
    console.log('Notification created:', notificationId);
    
    // Auto-clear notification after 8 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
      console.log('Notification cleared');
    }, 8000);
  });
}

// Optional: Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'hyperfunded-position') {
    // Open Hyperliquid in new tab
    chrome.tabs.create({ url: 'https://app.hyperliquid.xyz' });
  }
});
