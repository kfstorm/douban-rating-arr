// Simple popup functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if current page is a Radarr or Sonarr page
  checkCurrentTab();

  // Get current status from storage
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

    const statusElement = document.createElement('p');
    statusElement.textContent = `API 网址: ${data.doubanIdatabaseApiBaseUrl || DEFAULT_OPTIONS.doubanIdatabaseApiBaseUrl}`;

    const apiKeyStatus = document.createElement('p');
    apiKeyStatus.textContent = `豆瓣数据库 API 密钥: ${data.doubanIdatabaseApiKey ? '已配置' : '未配置'}`;

    document.body.insertBefore(statusElement, document.querySelector('.button'));
    document.body.insertBefore(apiKeyStatus, document.querySelector('.button'));

    // Add rating color legend
    const legendElement = document.createElement('div');
    legendElement.className = 'rating-legend';
    legendElement.innerHTML = `
      <p><strong>评分颜色说明:</strong></p>
      <div class="legend-item">
        <span class="color-dot" style="background-color: ${data.goodRatingColor || DEFAULT_OPTIONS.goodRatingColor}"></span>
        <span>好评 (≥ ${data.goodRatingThreshold || DEFAULT_OPTIONS.goodRatingThreshold})</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background-color: ${data.mediumRatingColor || DEFAULT_OPTIONS.mediumRatingColor}"></span>
        <span>中评 (≥ ${data.mediumRatingThreshold || DEFAULT_OPTIONS.mediumRatingThreshold})</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background-color: ${data.lowRatingColor || DEFAULT_OPTIONS.lowRatingColor}"></span>
        <span>低评 (< ${data.mediumRatingThreshold || DEFAULT_OPTIONS.mediumRatingThreshold})</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background-color: ${data.noRatingColor || DEFAULT_OPTIONS.noRatingColor}"></span>
        <span>暂无评分</span>
      </div>
    `;
    document.body.insertBefore(legendElement, document.querySelector('.button'));
  }).catch(function(error) {
    console.error('Error getting storage data:', error);
  });
});

// Function to check if the current tab is a Radarr or Sonarr page
function checkCurrentTab() {
  browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) {
    if (tabs[0]) {
      browser.tabs.sendMessage(
        tabs[0].id,
        {action: "getArrStatus"}
      ).then(function(response) {
        displayArrStatus(response);
      }).catch(function(error) {
        console.error('Error sending message to tab:', error);
        displayArrStatus(null);
      });
    }
  }).catch(function(error) {
    console.error('Error querying tabs:', error);
  });
}

// Function to display Radarr/Sonarr page status in the popup
function displayArrStatus(response) {
  const statusElement = document.createElement('div');
  statusElement.className = 'arr-status';

  if (response) {
    if (response.isRadarrPage || response.isSonarrPage) {
      const appType = response.isRadarrPage ? 'Radarr' : 'Sonarr';
      const contentType = response.isRadarrPage ? '电影' : '剧集';

      statusElement.innerHTML = `<p><strong>✅ 这是 ${appType} 页面</strong></p>`;
      if (response.hasApiAccess) {
        statusElement.innerHTML += '<p>✅ API 访问: 可用</p>';
        statusElement.innerHTML += `<p>豆瓣评分将显示在${contentType}旁边。</p>`;
      } else {
        statusElement.innerHTML += '<p>❌ API 访问: 不可用</p>';
      }
    } else {
      statusElement.innerHTML = '<p><strong>❌ 这不是 Radarr 或 Sonarr 页面</strong></p>';
      statusElement.innerHTML += '<p>豆瓣评分只会在 Radarr 和 Sonarr 页面上显示。</p>';
    }
  } else {
    statusElement.innerHTML = '<p><strong>❓ 无法确定这是否为 Radarr 或 Sonarr 页面</strong></p>';
    statusElement.innerHTML += '<p>扩展程序可能无法访问此页面。</p>';
  }

  // Insert the status at the top of the popup
  document.body.insertBefore(statusElement, document.body.firstChild);
}
