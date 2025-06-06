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

    // Add rating color legend using safer DOM manipulation
    const legendElement = document.createElement('div');
    legendElement.className = 'rating-legend';

    // Create title paragraph
    const titleP = document.createElement('p');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = '评分颜色说明:';
    titleP.appendChild(titleStrong);
    legendElement.appendChild(titleP);

    // Helper function to create legend item
    function createLegendItem(color, text) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'legend-item';

      const colorDot = document.createElement('span');
      colorDot.className = 'color-dot';
      colorDot.style.backgroundColor = color;

      const textSpan = document.createElement('span');
      textSpan.textContent = text;

      itemDiv.appendChild(colorDot);
      itemDiv.appendChild(textSpan);

      return itemDiv;
    }

    // Add legend items
    legendElement.appendChild(createLegendItem(
      data.goodRatingColor || DEFAULT_OPTIONS.goodRatingColor,
      `好评 (≥ ${data.goodRatingThreshold || DEFAULT_OPTIONS.goodRatingThreshold})`
    ));
    legendElement.appendChild(createLegendItem(
      data.mediumRatingColor || DEFAULT_OPTIONS.mediumRatingColor,
      `中评 (≥ ${data.mediumRatingThreshold || DEFAULT_OPTIONS.mediumRatingThreshold})`
    ));
    legendElement.appendChild(createLegendItem(
      data.lowRatingColor || DEFAULT_OPTIONS.lowRatingColor,
      `低评 (< ${data.mediumRatingThreshold || DEFAULT_OPTIONS.mediumRatingThreshold})`
    ));
    legendElement.appendChild(createLegendItem(
      data.noRatingColor || DEFAULT_OPTIONS.noRatingColor,
      '暂无评分'
    ));
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

      // Create main status message
      const mainP = document.createElement('p');
      const mainStrong = document.createElement('strong');
      mainStrong.textContent = `✅ 这是 ${appType} 页面`;
      mainP.appendChild(mainStrong);
      statusElement.appendChild(mainP);

      // Create API status message
      const apiP = document.createElement('p');
      if (response.hasApiAccess) {
        apiP.textContent = '✅ API 访问: 可用';
        statusElement.appendChild(apiP);

        const infoP = document.createElement('p');
        infoP.textContent = `豆瓣评分将显示在${contentType}旁边。`;
        statusElement.appendChild(infoP);
      } else {
        apiP.textContent = '❌ API 访问: 不可用';
        statusElement.appendChild(apiP);
      }
    } else {
      const mainP = document.createElement('p');
      const mainStrong = document.createElement('strong');
      mainStrong.textContent = '❌ 这不是 Radarr 或 Sonarr 页面';
      mainP.appendChild(mainStrong);
      statusElement.appendChild(mainP);

      const infoP = document.createElement('p');
      infoP.textContent = '豆瓣评分只会在 Radarr 和 Sonarr 页面上显示。';
      statusElement.appendChild(infoP);
    }
  } else {
    const mainP = document.createElement('p');
    const mainStrong = document.createElement('strong');
    mainStrong.textContent = '❓ 无法确定这是否为 Radarr 或 Sonarr 页面';
    mainP.appendChild(mainStrong);
    statusElement.appendChild(mainP);

    const infoP = document.createElement('p');
    infoP.textContent = '扩展程序可能无法访问此页面。';
    statusElement.appendChild(infoP);
  }

  // Insert the status at the top of the popup
  document.body.insertBefore(statusElement, document.body.firstChild);
}
