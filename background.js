// Background script for the Douban Ratings extension for Radarr & Sonarr

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set(DEFAULT_OPTIONS, function() {
    console.log('Default settings initialized');
  });
});
