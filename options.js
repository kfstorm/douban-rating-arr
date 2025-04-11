// Save options to Chrome storage
function saveOptions() {
  const doubanIdatabaseApiBaseUrl = document.getElementById('doubanIdatabaseApiBaseUrl').value.trim();
  const doubanIdatabaseApiKey = document.getElementById('doubanIdatabaseApiKey').value.trim();
  const goodRatingThreshold = parseFloat(document.getElementById('goodRatingThreshold').value) || DEFAULT_OPTIONS.goodRatingThreshold;
  const mediumRatingThreshold = parseFloat(document.getElementById('mediumRatingThreshold').value) || DEFAULT_OPTIONS.mediumRatingThreshold;
  const goodRatingColor = document.getElementById('goodRatingColor').value;
  const mediumRatingColor = document.getElementById('mediumRatingColor').value;
  const lowRatingColor = document.getElementById('lowRatingColor').value;
  const noRatingColor = document.getElementById('noRatingColor').value;

  chrome.storage.sync.set({
    doubanIdatabaseApiBaseUrl: doubanIdatabaseApiBaseUrl || DEFAULT_OPTIONS.doubanIdatabaseApiBaseUrl,
    doubanIdatabaseApiKey: doubanIdatabaseApiKey,
    goodRatingThreshold: goodRatingThreshold,
    mediumRatingThreshold: mediumRatingThreshold,
    goodRatingColor: goodRatingColor,
    mediumRatingColor: mediumRatingColor,
    lowRatingColor: lowRatingColor,
    noRatingColor: noRatingColor
  }, function() {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = '设置已保存！';
    status.className = 'status success';
    status.style.display = 'block';

    setTimeout(function() {
      status.style.display = 'none';
    }, 3000);
  });
}

// Restore saved options when opening the options page
function restoreOptions() {
  chrome.storage.sync.get(DEFAULT_OPTIONS, function(items) {
    document.getElementById('doubanIdatabaseApiBaseUrl').value = items.doubanIdatabaseApiBaseUrl;
    document.getElementById('doubanIdatabaseApiKey').value = items.doubanIdatabaseApiKey;
    document.getElementById('goodRatingThreshold').value = items.goodRatingThreshold;
    document.getElementById('mediumRatingThreshold').value = items.mediumRatingThreshold;
    document.getElementById('goodRatingColor').value = items.goodRatingColor;
    document.getElementById('mediumRatingColor').value = items.mediumRatingColor;
    document.getElementById('lowRatingColor').value = items.lowRatingColor;
    document.getElementById('noRatingColor').value = items.noRatingColor;

    // Update color previews
    updateColorPreviews(items);
  });
}

// Reset options to default values
function resetOptions() {
  // Set form values to defaults
  document.getElementById('doubanIdatabaseApiBaseUrl').value = DEFAULT_OPTIONS.doubanIdatabaseApiBaseUrl;
  document.getElementById('doubanIdatabaseApiKey').value = DEFAULT_OPTIONS.doubanIdatabaseApiKey;
  document.getElementById('goodRatingThreshold').value = DEFAULT_OPTIONS.goodRatingThreshold;
  document.getElementById('mediumRatingThreshold').value = DEFAULT_OPTIONS.mediumRatingThreshold;
  document.getElementById('goodRatingColor').value = DEFAULT_OPTIONS.goodRatingColor;
  document.getElementById('mediumRatingColor').value = DEFAULT_OPTIONS.mediumRatingColor;
  document.getElementById('lowRatingColor').value = DEFAULT_OPTIONS.lowRatingColor;
  document.getElementById('noRatingColor').value = DEFAULT_OPTIONS.noRatingColor;

  // Update color previews
  updateColorPreviews(DEFAULT_OPTIONS);

  // Show status message
  const status = document.getElementById('status');
  status.textContent = '已重置为默认设置！点击保存以应用更改。';
  status.className = 'status success';
  status.style.display = 'block';

  setTimeout(function() {
    status.style.display = 'none';
  }, 3000);
}

// Update color preview elements
function updateColorPreviews(items) {
  const goodColorPreview = document.getElementById('goodColorPreview');
  const mediumColorPreview = document.getElementById('mediumColorPreview');
  const lowColorPreview = document.getElementById('lowColorPreview');
  const noColorPreview = document.getElementById('noColorPreview');

  goodColorPreview.style.backgroundColor = items.goodRatingColor;
  mediumColorPreview.style.backgroundColor = items.mediumRatingColor;
  lowColorPreview.style.backgroundColor = items.lowRatingColor;
  noColorPreview.style.backgroundColor = items.noRatingColor;
}

// Add event listeners to update preview when colors change
function setupColorPreviewUpdates() {
  document.getElementById('goodRatingColor').addEventListener('input', function(e) {
    document.getElementById('goodColorPreview').style.backgroundColor = e.target.value;
  });

  document.getElementById('mediumRatingColor').addEventListener('input', function(e) {
    document.getElementById('mediumColorPreview').style.backgroundColor = e.target.value;
  });

  document.getElementById('lowRatingColor').addEventListener('input', function(e) {
    document.getElementById('lowColorPreview').style.backgroundColor = e.target.value;
  });

  document.getElementById('noRatingColor').addEventListener('input', function(e) {
    document.getElementById('noColorPreview').style.backgroundColor = e.target.value;
  });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  restoreOptions();
  setupColorPreviewUpdates();
});
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);
