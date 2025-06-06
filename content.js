// Content script that runs on Radarr and Sonarr pages

// Default API URL - this can be overridden in options
let doubanIdatabaseApiBaseUrl = DEFAULT_OPTIONS.doubanIdatabaseApiBaseUrl;
let doubanIdatabaseApiKey = DEFAULT_OPTIONS.doubanIdatabaseApiKey;
let arrApiRoot = '';
let arrApiKey = '';
let arrType = ''; // 'radarr' or 'sonarr'
// Rating threshold settings
let goodRatingThreshold = DEFAULT_OPTIONS.goodRatingThreshold;
let mediumRatingThreshold = DEFAULT_OPTIONS.mediumRatingThreshold;
let goodRatingColor = DEFAULT_OPTIONS.goodRatingColor;
let mediumRatingColor = DEFAULT_OPTIONS.mediumRatingColor;
let lowRatingColor = DEFAULT_OPTIONS.lowRatingColor;
let noRatingColor = DEFAULT_OPTIONS.noRatingColor;
// Add a variable to track the last time checkForMediaItems was called
let lastCheckTime = 0;
let isScrolling = false;
let scrollTimeout = null;
// Add a rating cache to avoid redundant API requests
let ratingCache = {}; // Maps IDs to {rating, url} objects
// Add media cache to avoid redundant API requests
let mediaCache = null;
let lastMediaCacheTime = 0;
const MEDIA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache validity

// Add flag to track if we're on a Radarr or Sonarr page
let isRadarrPage = false;
let isSonarrPage = false;

// Platform configuration for different *Arr sites
const arrPlatformConfig = {
  radarrHome: {
    // Finding container elements
    containerSelector: 'div[class^="MovieIndexPoster-content"]',

    // Finding poster element within container
    getPosterElement: (container) => container,

    // Extracting media ID from container
    getMediaId: (container) => {
      const link = container.querySelector('a[class^="MovieIndexPoster-link"]');
      if (!link || !link.href) return null;

      const parts = link.href.split("/");
      return {
        id: parts[parts.length - 1],
        type: 'tmdb'
      };
    },

    // Finding media item from API data
    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.tmdbId == mediaId.id);
    },

    // Custom styling for rating display
    ratingStyle: {},

    // React props configuration
    fetchReactProps: false,
    reactPropsPath: null
  },

  sonarrHome: {
    containerSelector: 'div[class^="SeriesIndexPoster-content"]',

    getPosterElement: (container) => container,

    getMediaId: (container) => {
      const link = container.querySelector('a[class^="SeriesIndexPoster-link"]');
      if (!link || !link.href) return null;

      const parts = link.href.split("/");
      return {
        id: parts[parts.length - 1],
        type: 'titleSlug'
      };
    },

    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.titleSlug === mediaId.id);
    },

    // Custom styling for rating display
    ratingStyle: {},

    // React props configuration
    fetchReactProps: false,
    reactPropsPath: null
  },

  // Add support for Sonarr's Add New Series page
  sonarrAddNew: {
    containerSelector: 'div[class^="AddNewSeriesSearchResult-searchResult"]',

    // Find the poster element within the search result
    // and wrap it in a container if it's an img
    getPosterElement: (container) => {
      const posterImg = container.querySelector('img[class^="AddNewSeriesSearchResult-poster"]');
      if (!posterImg) return null;

      // Check if the img is already wrapped
      let posterContainer = posterImg.parentElement;
      if (!posterContainer.classList.contains('douban-poster-container')) {
        // Create a container for the img
        posterContainer = document.createElement('div');
        posterContainer.className = 'douban-poster-container';
        posterContainer.style.position = 'relative';
        posterContainer.style.display = 'inline-block';

        // Insert the container at the img position and move the img inside
        posterImg.parentElement.insertBefore(posterContainer, posterImg);
        posterContainer.appendChild(posterImg);
      }

      return posterContainer;
    },

    // Extract TVDB ID from ThetvDB link
    getMediaId: (container) => {
      const tvdbLink = Array.from(container.querySelectorAll('a')).find(
        link => link.href && link.href.startsWith('https://www.thetvdb.com/')
      );

      if (!tvdbLink) return null;

      // Extract the ID from URL format like "https://www.thetvdb.com/?tab=series&id=253463"
      const match = tvdbLink.href.match(/[?&]id=(\d+)/);
      return match ? {
        id: match[1],
        type: 'tvdb'
      } : null;
    },

    // Find the media item using TVDB ID
    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.tvdbId == mediaId.id);
    },

    // Custom styling for rating display
    ratingStyle: {
      marginRight: '20px'
    },

    // React props configuration
    fetchReactProps: true,
    reactPropsPath: ".children[2].props"
  },

  // Add support for Radarr's Add New Movie page
  radarrAddNew: {
    containerSelector: 'div[class^="AddNewMovieSearchResult-searchResult"]',

    // Find the poster element within the search result
    getPosterElement: (container) => {
      const posterContainer = container.querySelector('div[class^="AddNewMovieSearchResult-posterContainer"]');
      return posterContainer || null;
    },

    // Extract TMDB ID from React props
    getMediaId: (container) => {
      const reactProps = container.reactProps;
      if (!reactProps) return null;

      const tmdbId = reactProps.tmdbId;
      return tmdbId ? { id: tmdbId, type: 'tmdb' } : null;
    },

    // Find the media item using TMDB ID
    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.tmdbId == mediaId.id);
    },

    // Custom styling for rating display
    ratingStyle: {
      marginRight: '20px'
    },

    // React props configuration
    fetchReactProps: true,
    reactPropsPath: ".children[2].props"
  },

  // Configuration for Radarr Movie Detail page
  radarrMovieDetail: {
    containerSelector: 'div[class^="MovieDetails-headerContent-"]', // Main info block for the movie
    getPosterElement: (container) => {
      // Find the poster image element
      return container.querySelector('img[class^="MovieDetails-poster-"]');
    },
    getMediaId: (container) => {
      const match = window.location.pathname.match(/^\/radarr\/movie\/(\d+)$/);
      if (match && match[1]) {
        // The Radarr API /movie endpoint returns items with an 'id' field which is this movie ID.
        return { id: match[1], type: 'tmdbId' };
      }
      return null;
    },
    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.tmdbId == mediaId.id);
    },
    // Custom styling for rating display
    ratingStyle: {
      marginRight: '35px'
    },
    fetchReactProps: false, // TMDB ID will be fetched via Radarr's API using radarrId
    reactPropsPath: null
  },

  // Configuration for Sonarr Series Detail page
  sonarrSeriesDetail: {
    containerSelector: 'div[class^="SeriesDetails-headerContent-"]', // Main info block for the series
    getPosterElement: (container) => {
      // Find the poster image element
      const targetDiv = container.querySelector('img[class^="SeriesDetails-poster-"]');
      return targetDiv;
    },
    getMediaId: (container) => {
      // The Sonarr API /series endpoint returns items with a 'titleSlug' field which is this series slug.
      const match = window.location.pathname.match(/^\/sonarr\/series\/([a-zA-Z0-9-]+)$/);
      if (match && match[1]) {
        return { id: match[1], type: 'titleSlug' };
      }
      return null;
    },
    findMediaItem: (mediaCache, mediaId) => {
      return mediaCache.find(m => m.titleSlug === mediaId.id);
    },
    // Custom styling for rating display
    ratingStyle: {
      marginRight: '35px'
    },
    fetchReactProps: false, // TVDB ID will be fetched via Sonarr's API using titleSlug
    reactPropsPath: null
  }
  // Additional platforms can be added here
};

// Helper function to get current platform configuration
function getCurrentPlatformConfig() {
  const pathname = window.location.pathname;
  if (isRadarrPage) {
    // Check if we're on the Add New Movie page
    if (pathname.includes('/add/new')) {
      return arrPlatformConfig.radarrAddNew;
    }
    if (pathname.includes('/movie/')) {
      return arrPlatformConfig.radarrMovieDetail;
    }
    return arrPlatformConfig.radarrHome;
  }

  if (isSonarrPage) {
    // Check if we're on the Add New Series page
    if (pathname.includes('/add/new')) {
      return arrPlatformConfig.sonarrAddNew;
    }
    if (pathname.includes('/series/')) {
      return arrPlatformConfig.sonarrSeriesDetail;
    }
    return arrPlatformConfig.sonarrHome;
  }

  return null;
}

// Function to check if we're on a Radarr or Sonarr page
function checkIfArrPage() {
  // Check for meta tag in head
  const metaTags = document.querySelectorAll('meta[name="description"]');
  for (const tag of metaTags) {
    if (tag.content === "Radarr") {
      isRadarrPage = true;
      return true;
    }
    if (tag.content === "Sonarr") {
      isSonarrPage = true;
      return true;
    }
  }

  return false;
}

// Function to inject a script into the page context to access window.Radarr or window.Sonarr
function injectApiScript() {
  // Only proceed if we think this is a Radarr or Sonarr page
  if (!isRadarrPage && !isSonarrPage) {
    return;
  }

  // Use the extension's own script file instead of inline script
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('api-access.js');
  (document.head || document.documentElement).appendChild(script);

  // Clean up after the script has loaded
  script.onload = function() {
    script.remove();
  };
}

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  // Make sure the message is from our page
  if (event.source !== window) return;

  // Listen for different message types
  if (event.data.type === 'ARR_API_DATA') {
    const apiInfo = event.data.payload;
    if (apiInfo.apiRoot && apiInfo.apiKey) {
      arrApiRoot = apiInfo.apiRoot;
      arrApiKey = apiInfo.apiKey;
      arrType = apiInfo.type;
      console.log(`Successfully retrieved ${arrType} API details`);

      // Immediately check for items once we have the API details
      checkForMediaItems(true);
    } else if (isRadarrPage || isSonarrPage) {
      // Only log the warning if we believe this is a relevant page
      console.warn('API details not found in page context');
    }
  } else if (event.data.type === 'REACT_PROPS_SCRIPT_READY') {
    // Mark the script as ready to receive requests
    window.reactPropsScriptReady = true;
    console.log('React props script is ready to receive requests');
  } else if (event.data.type === 'REACT_PROPS_RESPONSE') {
    // Handle response for a specific request
    const requestId = event.data.requestId;
    const propsData = event.data.payload;
    const success = event.data.success;

    if (success && propsData) {
      try {
        // Extract the original element ID from the requestId
        // The original format should be 'request-uniqueId'
        const uniqueId = requestId.replace('request-', '');
        const element = document.getElementById(uniqueId);

        if (element) {
          // Parse the JSON string back to an object
          const props = JSON.parse(propsData);

          // Store the props on the element for future use
          element.reactProps = props;

          // Dispatch a custom event to notify our code that props are available
          const propsEvent = new CustomEvent('react-props-loaded', {
            detail: { element, props }
          });
          document.dispatchEvent(propsEvent);

          // Process the element now that we have its props
          processMediaElement(element);
        } else {
          console.warn(`Element with ID '${uniqueId}' not found for request ${requestId}`);
        }
      } catch (e) {
        console.error('Error handling React props response:', e);
      }
    } else if (!success) {
      console.warn('Failed to get React props:', event.data.error);
    }
  }
});

// Add message listener to respond with page status
browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "getArrStatus") {
      sendResponse({
        isRadarrPage: isRadarrPage,
        isSonarrPage: isSonarrPage,
        hasApiAccess: !!(arrApiRoot && arrApiKey),
        type: arrType || (isRadarrPage ? 'radarr' : (isSonarrPage ? 'sonarr' : ''))
      });
    }
    return true; // Keep the message channel open for async response
  }
);

// First, get the API settings from storage
browser.storage.sync.get([
  'doubanIdatabaseApiBaseUrl',
  'doubanIdatabaseApiKey',
  'goodRatingThreshold',
  'mediumRatingThreshold',
  'goodRatingColor',
  'mediumRatingColor',
  'lowRatingColor',
  'noRatingColor'
]).then(function(data) {
  // Handle undefined data (Firefox compatibility)
  data = data || {};

  if (data.doubanIdatabaseApiBaseUrl) {
    doubanIdatabaseApiBaseUrl = data.doubanIdatabaseApiBaseUrl;
  }

  if (data.doubanIdatabaseApiKey) {
    doubanIdatabaseApiKey = data.doubanIdatabaseApiKey;
  }

  // Set rating thresholds and colors if available
  if (data.goodRatingThreshold) {
    goodRatingThreshold = data.goodRatingThreshold;
  }

  if (data.mediumRatingThreshold) {
    mediumRatingThreshold = data.mediumRatingThreshold;
  }

  if (data.goodRatingColor) {
    goodRatingColor = data.goodRatingColor;
  }

  if (data.mediumRatingColor) {
    mediumRatingColor = data.mediumRatingColor;
  }

  if (data.lowRatingColor) {
    lowRatingColor = data.lowRatingColor;
  }

  if (data.noRatingColor) {
    noRatingColor = data.noRatingColor;
  }

  // Start processing once the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processArrPage);
  } else {
    processArrPage();
  }
}).catch(function(error) {
  console.error('Error getting storage data:', error);
  // Continue with defaults if storage fails
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processArrPage);
  } else {
    processArrPage();
  }
});

// Helper function to check if an element is in the viewport
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Main function to process the page
function processArrPage() {
  // Only check if we're on a Radarr/Sonarr page once
  const isArrPage = checkIfArrPage();

  // Only continue if we think this is a relevant page
  if (!isArrPage) {
    return;
  }

  // Try to get API details from page context
  injectApiScript();

  // Use MutationObserver to detect when new items are added to the page
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        checkForMediaItems();
      }
    });
  });

  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check for items
  checkForMediaItems();

  // Set up intersection observer to detect when elements come into view
  setupIntersectionObserver();

  // Set up periodic checks for missed elements
  setInterval(checkForMediaItems, 3000);

  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
}

// Function to handle scroll events
function handleScroll() {
  isScrolling = true;

  // Clear previous timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  // Set a timeout to run after scrolling stops
  scrollTimeout = setTimeout(function() {
    isScrolling = false;
    processUnprocessedElements();
  }, 300);
}

// Function to get all media elements based on the current page type
function getMediaElements(viewportOnly = false) {
  const config = getCurrentPlatformConfig();
  if (!config) return [];

  const elements = [...document.querySelectorAll(config.containerSelector)];

  // If viewportOnly is true, filter for elements in viewport
  if (viewportOnly) {
    return elements.filter(isElementInViewport);
  }

  return elements;
}

// Function to set up intersection observer
function setupIntersectionObserver() {
  const options = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // trigger when at least 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        // Process this element when it comes into view
        processMediaElement(element);
        // Unobserve after processing
        observer.unobserve(element);
      }
    });
  }, options);

  // Observe all media elements
  function observeMediaElements() {
    const mediaElements = getMediaElements();
    mediaElements.forEach(element => {
      // Only observe if it hasn't been processed yet
      if (!element.getAttribute('data-douban-media-id')) {
        observer.observe(element);
      }
    });
  }

  // Initial observation
  observeMediaElements();

  // Set up periodic checks for new elements to observe
  setInterval(observeMediaElements, 2000);
}

// Function to process elements that weren't processed during scrolling
function processUnprocessedElements() {
  // Only get elements that are currently in the viewport
  const visibleMediaElements = getMediaElements(true);

  if (visibleMediaElements.length > 0) {
    visibleMediaElements.forEach(element => {
      processMediaElement(element);
    });
  }
}

// Function to check for media items (movies or TV shows)
function checkForMediaItems(force = false) {
  // Skip if not on a relevant page
  if (!isRadarrPage && !isSonarrPage) {
    return;
  }

  // Check if enough time has passed since the last call or if forcing
  const currentTime = Date.now();
  if (!force && currentTime - lastCheckTime < 500) {
    // Not enough time has passed, exit early
    return;
  }

  // Update the last check time
  lastCheckTime = currentTime;

  // If we don't have API settings yet, try to get them
  if (!arrApiRoot || !arrApiKey) {
    injectApiScript();
    return;
  }

  // Otherwise fetch items from API
  fetchMediaFromAPI();
}

// Function to fetch media from Radarr/Sonarr API
function fetchMediaFromAPI() {
  const currentTime = Date.now();

  // Check if we have a valid cache
  if (mediaCache && (currentTime - lastMediaCacheTime < MEDIA_CACHE_TTL)) {
    processMediaFromAPI(mediaCache);
    return;
  }

  const endpoint = isRadarrPage ? 'movie' : 'series';

  // Construct absolute URL for Firefox compatibility
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}${arrApiRoot}/${endpoint}?apikey=${arrApiKey}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API request failed for ${isRadarrPage ? 'Radarr' : 'Sonarr'}`);
      }
      return response.json();
    })
    .then(media => {
      // Update the cache
      mediaCache = media;
      lastMediaCacheTime = currentTime;

      processMediaFromAPI(media);
    })
    .catch(error => {
      console.error('Error fetching media from API:', error);
    });
}

// Process media from API and match with DOM elements
function processMediaFromAPI(media) {
  // Only process media elements that are currently visible
  const visibleMediaElements = getMediaElements(true);

  visibleMediaElements.forEach(element => {
    processMediaElement(element);
  });
}

// Function to process a single media element (movie or TV show)
function processMediaElement(mediaElement) {
  if (!mediaCache) {
    return;
  }

  // Get the platform-specific configuration
  const config = getCurrentPlatformConfig();
  if (!config) return;

  // Only fetch React props if enabled for the current platform
  if (config.fetchReactProps && !mediaElement.reactProps) {
    // If not, try to get them with the configured path
    asyncFetchAndFillReactProps(mediaElement, config.reactPropsPath);
  }

  // Step 1: Find the container element (already done - mediaElement is the container)

  // Step 2: Find the poster element in the container
  const posterElement = config.getPosterElement(mediaElement);
  if (!posterElement) return;

  // Step 3: Find the media ID of the container element
  const mediaId = config.getMediaId(mediaElement);
  if (!mediaId) return;

  // Check if this element has already been processed for this specific media
  const currentMediaId = mediaElement.getAttribute('data-douban-media-id');

  // If the element has been processed for this specific media, no need to process again
  if (currentMediaId === mediaId.id) {
    return;
  }

  // If the element has a rating display but for a different media, remove it
  if (currentMediaId && currentMediaId !== mediaId.id) {
    const existingRatingElement = mediaElement.closest('.douban-poster-container') || mediaElement;
    const existingRating = existingRatingElement.querySelector('.douban-rating');
    if (existingRating) {
      existingRating.remove();
    }
  }

  // Find matching media in our cache using the configuration
  const mediaItem = config.findMediaItem(mediaCache, mediaId);

  // Store the current media ID to detect changes
  mediaElement.setAttribute('data-douban-media-id', mediaId.id);

  // Check if rating is already in cache
  if (ratingCache[mediaId.id] !== undefined) {
    // Use cached rating and url
    const { rating, url } = ratingCache[mediaId.id];
    displayDoubanRating(rating, url, posterElement);
  } else if (mediaItem) {
    // If we have the media item, use it to fetch the rating
    fetchDoubanRating(mediaItem, mediaId.id).then(({ rating, url }) => {
      displayDoubanRating(rating, url, posterElement);
    });
  } else {
    // If no media item found but we know the ID type, we can try to fetch rating with it
    const pseudoMediaItem = {};

    // Use the mediaId type to decide which ID to use
    switch (mediaId.type) {
      case 'tmdb':
        pseudoMediaItem.tmdbId = mediaId.id;
        break;
      case 'tvdb':
        pseudoMediaItem.tvdbId = mediaId.id;
        break;
      case 'imdb':
        pseudoMediaItem.imdbId = mediaId.id;
        break;
      // For titleSlug or other types, we don't have a direct match to ID types
      default:
        // No direct mapping to ID types we can use, display placeholder
        displayDoubanRating(null, null, posterElement);
        return;
    }

    // Fetch the rating using the pseudo media item
    fetchDoubanRating(pseudoMediaItem, mediaId.id).then(({ rating, url }) => {
      displayDoubanRating(rating, url, posterElement);
    });
  }
}

// Function to extract React props from a DOM element
function asyncFetchAndFillReactProps(element, propPath) {
  if (!element) return null;

  // Create a unique ID for both the element and the request
  const uniqueId = element.id || ('react-props-' + Math.random().toString(36).substr(2, 9));

  if (!element.id) {
    // If no ID exists, add one temporarily
    element.id = uniqueId;
  }

  // Use the ID as the selector
  const selector = '#' + uniqueId;

  // Check if the script is already injected
  if (!window.reactPropsScriptInjected) {
    // Flag to track if the script is loaded
    window.reactPropsScriptInjected = true;
    window.reactPropsScriptReady = false;

    // Create a script element that points to our external script
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('react-props-access.js');

    // Append the script to the document
    document.head.appendChild(script);

    // Clean up after the script has loaded
    script.onload = function() {
      console.log('React props script loaded');
    };
  }

  // Function to send the request for React props
  function sendReactPropsRequest() {
    // Use the same uniqueId for the requestId to ensure they match
    const requestId = 'request-' + uniqueId;

    // Send a message to the page context
    window.postMessage({
      type: 'GET_REACT_PROPS',
      selector: selector,
      requestId: requestId,
      propPath: propPath
    }, '*');

    return requestId;
  }

  // If the script is ready, send the request immediately
  if (window.reactPropsScriptReady) {
    sendReactPropsRequest();
  } else {
    // Otherwise, wait for the script to be ready
    const checkInterval = setInterval(() => {
      if (window.reactPropsScriptReady) {
        clearInterval(checkInterval);
        sendReactPropsRequest();
      }
    }, 50);

    // Set a timeout to clear the interval if it takes too long
    setTimeout(() => {
      if (!window.reactPropsScriptReady) {
        clearInterval(checkInterval);
        console.warn('React props script did not load in time');
      }
    }, 2000);
  }

  // Return null for now, as the actual props will be received via message event
  return null;
}

// Function to fetch Douban rating using the API
function fetchDoubanRating(mediaItem, mediaId) {
  // Build query parameters based on available IDs
  let params = new URLSearchParams();

  if (doubanIdatabaseApiKey) {
    params.append('api_key', doubanIdatabaseApiKey);
  }

  if (mediaItem.imdbId) {
    params.append('imdb_id', mediaItem.imdbId);
  } else if (mediaItem.tmdbId) {
    params.append('tmdb_id', mediaItem.tmdbId);
    if (isRadarrPage) {
      params.append('tmdb_media_type', 'movie');
    } else if (isSonarrPage) {
      params.append('tmdb_media_type', 'tv');
    }
  } else if (mediaItem.tvdbId) {
    params.append('tvdb_id', mediaItem.tvdbId);
  } else {
    // No valid ID found, return empty result
    return Promise.resolve({ rating: null, url: null });
  }

  const url = `${doubanIdatabaseApiBaseUrl}/api/item?${params.toString()}`;

  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      return null;
    })
    .catch(() => {
      return null;
    })
    .then(data => {
      let rating = null;
      let url = null;
      let doubanId = null;

      if (data && data.length > 0) {
        const item = data[0];
        if (item) {
          rating = item.rating || null;
          doubanId = item.douban_id || null;

          // Construct the Douban URL using the douban_id
          if (doubanId) {
            url = `https://movie.douban.com/subject/${doubanId}/`;
          }
        }
      }

      // Store in cache as an object with both rating and url
      ratingCache[mediaId] = { rating, url };

      return { rating, url };
    });
}

// Function to display the Douban rating in the UI
function displayDoubanRating(ratingValue, url, mediaElement) {
  let ratingAppendTarget = mediaElement; // This is the element to which the rating will be appended.

  // If the mediaElement is an IMG, we need to ensure it's wrapped for correct positioning of the rating.
  if (mediaElement.tagName === 'IMG') {
    let wrapper = mediaElement.parentElement;
    // Check if it's already wrapped by our standard container class.
    if (wrapper && wrapper.classList.contains('douban-poster-container')) {
      ratingAppendTarget = wrapper;
    } else {
      // Create a new wrapper with the standard class.
      const newWrapper = document.createElement('div');
      newWrapper.className = 'douban-poster-container'; // Consistent class name
      newWrapper.style.position = 'relative';
      newWrapper.style.display = 'inline-block'; // Ensures wrapper fits image size.

      // Insert the wrapper in place of the image and move the image into the wrapper.
      if (mediaElement.parentNode) {
        mediaElement.parentNode.insertBefore(newWrapper, mediaElement);
      }
      newWrapper.appendChild(mediaElement);
      ratingAppendTarget = newWrapper;
    }
  } else {
    // For non-IMG elements (typically DIVs that are already containers),
    // ensure they can serve as a positioning context for an absolute-positioned rating.
    if (getComputedStyle(mediaElement).position === 'static') {
      mediaElement.style.position = 'relative';
    }
    // ratingAppendTarget is already mediaElement
  }

  // Remove any existing rating element from the ratingAppendTarget.
  // This ensures that if the rating is updated, the old one is cleared.
  const existingRating = ratingAppendTarget.querySelector('.douban-rating');
  if (existingRating) {
    existingRating.remove();
  }

  // Create the base rating element (anchor if URL exists, otherwise div).
  const ratingElement = document.createElement(url ? 'a' : 'div');
  ratingElement.className = 'douban-rating'; // This class should handle absolute positioning via CSS.

  // Set link properties if a Douban URL is available.
  if (url) {
    ratingElement.href = url;
    ratingElement.target = '_blank'; // Open link in a new tab.
    ratingElement.title = '点击查看豆瓣详情'; // Tooltip for the link.
  }

  // Apply platform-specific styles from the configuration (e.g., margins).
  const platformConfig = getCurrentPlatformConfig();
  if (platformConfig && platformConfig.ratingStyle) {
    Object.assign(ratingElement.style, platformConfig.ratingStyle);
  }

  // Determine rating color and display string based on the rating value.
  let ratingClass = 'low'; // Default to 'low' if rating is present but below medium.
  let ratingColor = lowRatingColor;
  let ratingStr;

  // Handle no rating case
  if (ratingValue == null) {
    ratingClass = 'none';
    ratingColor = noRatingColor;
    if (url) {
      ratingStr = 'N/A';
    } else {
      ratingStr = '?';
    }
  } else {
    // Format the rating to always display with one decimal place
    ratingStr = ratingValue.toFixed(1);

    if (ratingValue >= goodRatingThreshold) {
      ratingClass = 'good';
      ratingColor = goodRatingColor;
    } else if (ratingValue >= mediumRatingThreshold) {
      ratingClass = 'medium';
      ratingColor = mediumRatingColor;
    }
  }

  // Create rating content using safer DOM manipulation
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'douban-score';

  // Create logo span
  const logoSpan = document.createElement('span');
  logoSpan.className = `douban-logo douban-logo-${ratingClass}`;
  logoSpan.style.backgroundColor = ratingColor;
  logoSpan.textContent = '豆';

  // Create value span
  const valueSpan = document.createElement('span');
  valueSpan.className = `douban-value douban-value-${ratingClass}`;
  valueSpan.style.color = ratingColor;
  valueSpan.textContent = ratingStr;

  // Append spans to score div
  scoreDiv.appendChild(logoSpan);
  scoreDiv.appendChild(valueSpan);

  // Append score div to rating element
  ratingElement.appendChild(scoreDiv);
  // Append the newly created rating element to the determined target.
  ratingAppendTarget.appendChild(ratingElement);
}
