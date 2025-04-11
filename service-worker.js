// Entry point for the service worker
// This file loads all the background scripts

try {
  // Import other scripts
  importScripts('defaults.js', 'background.js');
} catch (e) {
  console.error('Error importing background scripts:', e);
}
