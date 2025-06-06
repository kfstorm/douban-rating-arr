# Privacy Policy for Douban Rating for Radarr & Sonarr

## Overview

Douban Rating for Radarr & Sonarr is a browser extension that displays Douban movie and TV show ratings on your Radarr and Sonarr web interfaces. This privacy policy explains exactly what data the extension accesses, how it's used, and where it's sent.

## Data the Extension Accesses

### 1. Radarr/Sonarr Configuration Data

The extension accesses configuration information from your Radarr or Sonarr web interface by:

- Reading `window.Radarr` or `window.Sonarr` JavaScript objects to obtain API endpoints and keys
- This allows the extension to communicate with your Radarr/Sonarr APIs to retrieve movie/TV show metadata

### 2. Movie and TV Show Metadata

From your Radarr/Sonarr installation, the extension accesses:

- **Movie identifiers**: TMDB IDs, IMDB IDs
- **TV show identifiers**: TVDB IDs, TMDB IDs
- **Media type information** (movie or TV show)
- This metadata is necessary to look up corresponding Douban ratings

### 3. User Preferences

The extension stores your configuration settings in your browser's local storage:

- Douban database API server URL (default: `https://douban-idatabase.kfstorm.com`)
- API key for the Douban database service (optional)
- Rating display preferences (color thresholds and colors)
- These settings are synchronized across your browser sessions using `browser.storage.sync`

## How Your Data is Used

### Local Processing

- Movie/TV show identifiers are extracted from Radarr/Sonarr web pages
- Rating data is cached temporarily in memory (5-minute cache) to avoid redundant API calls
- All visual modifications happen locally in your browser

### External API Calls

The extension makes HTTP requests to a Douban database API service with:

- **Movie queries**: IMDB ID or TMDB ID + media type (movie)
- **TV show queries**: TVDB ID or TMDB ID + media type (tv)
- **Optional API key** (if you've configured one)

**Example API calls:**

- `GET https://douban-idatabase.kfstorm.com/api/item?imdb_id=tt0111161`
- `GET https://douban-idatabase.kfstorm.com/api/item?tmdb_id=278&tmdb_media_type=movie`
- `GET https://douban-idatabase.kfstorm.com/api/item?tvdb_id=81189`

## Data Sharing and Third-Party Services

### Default Douban Database API Service

By default, the extension sends movie/TV identifiers to `https://douban-idatabase.kfstorm.com` to retrieve ratings. This service:

- Is operated by the extension developer to provide rating lookup functionality
- Receives only the specific movie/TV identifiers needed for rating lookup (TMDB, TVDB, or IMDB IDs)
- Does not receive any personal information, browsing history, or Radarr/Sonarr credentials
- Returns Douban ratings and movie URLs in JSON format
- May log requests for basic operational purposes (error monitoring, performance optimization)

### Custom API Services

If you configure a custom Douban database API service:

- The same movie/TV identifiers are sent to your chosen service
- You are responsible for understanding that service's privacy practices
- The extension does not validate or control third-party API services

### Data Collection by Extension Developer

The default API service operated by the extension developer:

- Receives movie/TV identifiers (TMDB, TVDB, IMDB IDs) when you use the extension
- May collect basic request logs for operational purposes (error tracking, performance monitoring)
- Does not collect or store any personal information, browsing history, or authentication credentials
- Does not track individual users or create user profiles

## Data Storage and Retention

### Local Storage

- Configuration preferences are stored in your browser using `browser.storage.sync`
- Rating data is cached temporarily in memory and cleared when you close the browser tab
- No persistent local databases are created

### Removing Your Data

You can remove all extension data by:

- Uninstalling the extension (removes all stored preferences)
- Clearing extension data through your browser's settings
- Using the extension's options page to reset preferences

## Security Measures

- All API communications use HTTPS when supported by the API service
- Your Radarr/Sonarr API credentials are only accessed locally and never transmitted to external services
- The extension follows browser security policies and content security restrictions

## Required Permissions Explained

### `<all_urls>` (Access to all websites)

**Why needed**: Radarr and Sonarr can be installed on any domain (local networks, custom domains, etc.)
**How used**: Only activates on pages that contain Radarr or Sonarr interfaces
**What's accessed**: Only the specific movie/TV metadata displayed on these pages

### `storage`

**Why needed**: To save your configuration preferences
**What's stored**: API settings, color preferences, rating thresholds

### `activeTab`

**Why needed**: To modify the current page content and display ratings
**How used**: To inject rating displays into Radarr/Sonarr web interfaces

## Your Control and Rights

You have complete control over:

- Whether to use the default API service or configure your own
- All rating display preferences and thresholds
- When to enable or disable the extension
- Complete removal of all extension data

## Changes to This Policy

This privacy policy may be updated to reflect changes in the extension's functionality. Updated versions will be available in the extension's repository and documentation.

## Contact and Transparency

- This extension is open source: all code is publicly available for review
- Questions or concerns can be raised through the GitHub repository
- No hidden functionality: everything the extension does is documented and reviewable

## Summary

This extension operates with a privacy-first approach:

- ✅ Only accesses movie/TV identifiers necessary for rating lookups
- ✅ Stores preferences locally in your browser
- ✅ Makes minimal, targeted API calls to rating services
- ❌ Does not collect personal information
- ❌ Does not track usage or analytics
- ❌ Does not access browsing history or other sensitive data
