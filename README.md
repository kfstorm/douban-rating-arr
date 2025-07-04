# 豆瓣评分 for Radarr & Sonarr

一款浏览器扩展，可在 Radarr 和 Sonarr 界面中直接显示电影和剧集的豆瓣评分。

![豆瓣评分 for Radarr & Sonarr 图标](images/icon128.png)

## 效果展示

### Radarr 中的豆瓣评分

![Radarr中的豆瓣评分效果展示](images/screenshot_radarr.jpeg)

### Sonarr 中的豆瓣评分

![Sonarr中的豆瓣评分效果展示](images/screenshot_sonarr.jpeg)

## 功能特点

- 在 Radarr 和 Sonarr 的电影/剧集海报旁边（包括主页、添加新电影/剧集页面、以及电影/剧集详情页面）显示豆瓣评分
- 通过不同颜色直观区分高、中、低评分
- 点击评分可直接跳转到豆瓣页面查看详情
- 可自定义评分阈值和颜色
- 支持自定义豆瓣数据库 API 地址

## 安装方法

### 方式一：应用商店安装（推荐）

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/mbjdgljhmaehnebnfoolinphhcmphife?style=for-the-badge&logo=googlechrome&logoColor=white&label=Chrome)](https://chromewebstore.google.com/detail/%E8%B1%86%E7%93%A3%E8%AF%84%E5%88%86-for-radarr-sonarr/mbjdgljhmaehnebnfoolinphhcmphife) [![Mozilla Add-on Version](https://img.shields.io/amo/v/douban-rating-arr?style=for-the-badge&logo=firefox%20browser&logoColor=white&label=Firefox)](https://addons.mozilla.org/en-US/firefox/addon/douban-rating-arr/)

> [!TIP]
> Firefox版本也支持安卓端

### 方式二：手动构建安装

如果您想要安装最新开发版本或用于其他浏览器，可以按以下步骤手动构建：

1. 运行构建脚本生成浏览器特定的扩展包：

   ```bash
   ./build.sh
   ```

   **注意**：构建脚本需要在类 Unix 系统（macOS、Linux）或 Windows 的 WSL/Git Bash 环境中运行。

2. 这将在 `build/` 目录下生成：
   - `douban-rating-arr-chrome.zip` - Chrome 版本
   - `douban-rating-arr-firefox.zip` - Firefox 版本

#### Chrome / Edge / 其他基于 Chromium 的浏览器

1. 解压 `build/douban-rating-arr-chrome.zip` 到本地文件夹
2. 打开浏览器扩展管理页面：
   - Chrome: 输入 `chrome://extensions/`
   - Edge: 输入 `edge://extensions/`
3. 在右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压的 Chrome 版本文件夹
6. 扩展图标将显示在浏览器工具栏中

#### Firefox（手动安装开发版本）

1. 解压 `build/douban-rating-arr-firefox.zip` 到本地文件夹
2. 打开 Firefox 浏览器，输入 `about:debugging`
3. 点击左侧菜单中的"此 Firefox"
4. 点击"载入临时附加组件"
5. 导航到解压的文件夹并选择其中的 `manifest.json` 文件
6. 扩展图标将显示在浏览器工具栏中

---

扩展安装后即可使用，默认已配置好可用的豆瓣数据库 API，无需额外设置即可正常工作。

## 配置说明

扩展已预设默认 API，但如果您想使用自定义配置：

1. 点击扩展图标，然后点击"设置"
2. 可选配置项：
   - **豆瓣数据库 API 基础网址**：默认已配置可用 API，如需使用其他 API 服务，可在此修改
   - **豆瓣数据库 API 密钥**：仅当您的自定义 API 需要密钥验证时才需填写
   - **评分显示设置**：根据您的喜好调整评分阈值和颜色

### 评分显示设置

您可以自定义以下参数：

- **好评阈值**：高于此值的评分将显示为绿色
- **中评阈值**：高于此值但低于好评阈值的评分将显示为黄色
- **好评颜色**：自定义好评（高分）的显示颜色
- **中评颜色**：自定义中评的显示颜色
- **低评颜色**：自定义低评的显示颜色
- **无评分颜色**：自定义无评分条目的显示颜色

## 使用方法

配置完成后，扩展会自动在您访问的 Radarr 和 Sonarr 页面上运行：

1. 打开您的 Radarr 或 Sonarr 页面
2. 浏览电影或剧集时，将会在海报的右上角看到豆瓣评分
3. 颜色直观反映评分高低：
   - 绿色：好评
   - 黄色：中评
   - 红色：低评
   - 灰色：暂无评分
4. 点击评分即可跳转到豆瓣相应电影/剧集的详情页

## 技术原理

### 电影/剧集与豆瓣条目的映射机制

本扩展通过以下步骤将 Radarr/Sonarr 中的电影和剧集映射到豆瓣条目：

1. **信息获取**：
   - 扩展通过获取 Radarr/Sonarr 页面中的 JavaScript 对象访问其 API
   - 从 Radarr 或 Sonarr API 获取电影或剧集的详细信息，特别是 IMDb ID

2. **映射过程**：
   - 使用 IMDb/TMDB/TVDB ID 作为主要标识符，向豆瓣数据库 API 发送查询请求
   - 豆瓣数据库 API 负责将 IMDb/TMDB/TVDB ID 映射到对应的豆瓣条目 ID

3. **数据缓存**：
   - 扩展会缓存已查询的评分结果，减少重复请求
   - 媒体信息缓存有效期为 5 分钟，优化性能和资源使用

### 自建豆瓣数据库 API 要求

扩展已预配置默认的豆瓣数据库 API 服务，无需额外设置。如果您出于隐私考虑或需要更高查询速度，可以自行开发或使用第三方提供的豆瓣数据库 API 服务，只要其符合下面的接口要求即可。

豆瓣数据库 API 需要提供以下功能：

- 支持多种 ID 类型作为输入参数：
  - IMDb ID：`/api/item?imdb_id=tt0111161`
  - TMDB ID 与媒体类型：`/api/item?tmdb_id=278&tmdb_media_type=movie`
  - TVDB ID：`/api/item?tvdb_id=81189`

- 返回包含以下信息的 JSON 格式数据：

  ```json
  [
    {
      "douban_id": "1292052",
      "rating": 9.7
    }
  ]
  ```

## 故障排除

如果您无法看到评分：

1. 确认您正在浏览 Radarr 或 Sonarr 页面
2. 检查扩展图标，查看状态信息
3. 确认您的豆瓣数据库 API 设置正确
4. 刷新页面或重启浏览器

## 提示与技巧

- 初次加载页面时，评分获取可能需要一些时间
- 滚动查看更多内容时，扩展会自动为新出现的电影/剧集获取评分
- 您可以通过点击扩展图标查看扩展状态

## 系统要求

- 现代浏览器：
  - 基于 Chromium 的浏览器（Chrome、Edge 等）
  - Mozilla Firefox
- 正常运行的 Radarr 和/或 Sonarr 实例
- 可访问的豆瓣数据库 API 服务

## 隐私说明

本扩展：

- 不会收集任何个人信息
- 仅在您访问 Radarr 和 Sonarr 页面时工作
- 仅从您配置的豆瓣数据库 API 获取数据

## 许可协议

本项目采用 [MIT 许可协议](LICENSE)。您可以自由地使用、修改和分发此代码，但需保留原始版权和许可声明。
