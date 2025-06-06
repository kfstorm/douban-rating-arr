// Background script for the Douban Ratings extension for Radarr & Sonarr

// Initialize default settings when extension is installed
browser.runtime.onInstalled.addListener(function() {
  browser.storage.sync.set(DEFAULT_OPTIONS).then(function() {
    console.log('Default settings initialized');
  }).catch(function(error) {
    console.error('Error initializing default settings:', error);
  });
});
