// Background script for the Douban Ratings extension for Radarr & Sonarr

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set(DEFAULT_OPTIONS, function() {
    console.log('Default settings initialized');
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'fetchDoubanRating') {
    const doubanIdatabaseApiBaseUrl = request.doubanIdatabaseApiBaseUrl || DEFAULT_OPTIONS.doubanIdatabaseApiBaseUrl;
    const doubanIdatabaseApiKey = request.doubanIdatabaseApiKey || '';
    const imdbId = request.imdbId;

    if (!imdbId) {
      sendResponse({ success: false, error: 'No IMDb ID provided' });
      return true;
    }

    let url = `${doubanIdatabaseApiBaseUrl}/api/item?imdb_id=${imdbId}`;
    if (doubanIdatabaseApiKey) {
      url += `&api_key=${doubanIdatabaseApiKey}`;
    }

    fetch(url)
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});
