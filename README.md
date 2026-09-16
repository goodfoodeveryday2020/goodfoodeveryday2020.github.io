# 日日好食｜官方連結頁

純 HTML / CSS / JS 的靜態連結頁（取代 Linktree），沒有任何第三方追蹤，
內容全部由 **Google 試算表** 管理：在試算表改標題、連結、圖片，重新整理網頁就會更新。

```
goodfood-links/
├─ index.html              頁面骨架 + 內建快照資料（試算表讀不到時的後備）
├─ assets/
│  ├─ css/style.css        樣式（顏色在 :root 變數）
│  ├─ js/config.js         ★ 試算表 ID 與載入動畫設定
│  ├─ js/loader.js         載入動畫（「食」書寫 → 上色 → 飛入頁首）
│  ├─ js/app.js            讀試算表 CSV → 渲染
│  ├─ fonts/               品牌字型子集（僅「日日好食控麵」五字）
│  └─ img/                 logo、favicon、連結縮圖（assets/img/links/）
├─ sheets/設定.csv          ★ 匯入 Google 試算表用的範本
├─ sheets/連結.csv          ★ 同上
└─ tools/update-snapshot.py 把試算表內容寫回 index.html 的內建快照（選用）
```

## 1. 本機預覽

```bash
cd goodfood-links && python3 -m http.server 8080
```

開 <http://localhost:8080/>。直接雙擊 `index.html` 也能看，但瀏覽器在 `file://` 下不會去讀試算表。

## 2. 接上 Google 試算表（讓前端跟著試算表更新）

1. 到 Google 試算表建立一份新的試算表。
2. **檔案 → 匯入 → 上傳** `sheets/設定.csv`，選「插入新的工作表」；再匯入一次 `sheets/連結.csv`。
3. 把兩個工作表分頁**改名為 `設定` 和 `連結`**（名稱要和 `assets/js/config.js` 裡的一致）。
4. 右上角 **共用 → 一般存取權 → 知道連結的任何人 → 檢視者**。
5. 複製網址中 `/d/` 和 `/edit` 之間的那一串 ID，貼到 `assets/js/config.js`：

   ```js
   sheetId: "1AbC...xyz",
   ```

6. 重新整理網頁。頁尾會顯示「資料來源：Google 試算表」代表已接上；若顯示「內建快照」，
   打開瀏覽器主控台（F12）看錯誤訊息，最常見的原因是試算表沒有設成「知道連結的任何人可檢視」。

之後只要在試算表改內容、存檔，網頁重新整理就會更新（沒有快取）。

### 「設定」分頁（欄位：項目、內容）

| 項目 | 說明 |
|---|---|
| 名稱 | 頁首大字（品牌字型只含「日日好食控麵」五字，其他字會用系統字） |
| 英文名稱 | 名稱下方的小字 |
| 標語 | 一句話介紹，留空則不顯示 |
| 頭像 | 留空＝用 logo；填圖片網址就換成該圖 |
| 分頁標題、說明 | 瀏覽器分頁標題與搜尋引擎描述 |
| Facebook、Instagram、YouTube、TikTok、LINE、Email、官方網站 | 填網址就出現對應圖示，留空就不顯示 |
| 頁尾文字 | 版權列文字 |

### 「連結」分頁（欄位：順序、類型、標題、連結、圖片、顯示方式、顯示）

| 欄位 | 填法 |
|---|---|
| 順序 | 數字，小的在上；留空則照列的順序 |
| 類型 | `連結`（一般卡片）、`影片`（YouTube）、`標題`（一行分段小標，只需要填標題） |
| 標題 | 卡片文字 |
| 連結 | 完整網址；影片填 YouTube 網址（watch、youtu.be、shorts 都可以） |
| 圖片 | 公開的圖片網址，或這個資料夾內的相對路徑（例如 `assets/img/links/01-persona-media-com.jpeg`）。影片留空會自動抓 YouTube 縮圖 |
| 顯示方式 | 影片專用：`嵌入` = 大圖＋播放鍵、按了在頁面內播放；留空或 `卡片` = 一般卡片 |
| 顯示 | 填 `否` 就隱藏這一列，留空或 `是` 就顯示 |

圖片放 Google 雲端硬碟不一定能直接顯示（Drive 會擋外連），建議放進 `assets/img/links/`
一起上傳，或用 Imgur、Cloudinary 之類可直連的圖床。

### 更新內建快照（選用）

試算表讀不到時（斷網、試算表被改成私人），頁面會退回 `index.html` 內建的快照。
想把目前試算表的內容固化成新的快照：

```bash
python3 tools/update-snapshot.py
```

## 3. 上架到 GitHub Pages

```bash
cd goodfood-links
git remote add origin https://github.com/<你的帳號>/goodfood-links.git
git push -u origin main
```

推上去之後：GitHub 專案頁 → **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**，
一兩分鐘後網址是 `https://<你的帳號>.github.io/goodfood-links/`。
要用自己的網域（例如 `links.goodfoodeveryday.com.tw`）在同一頁填 Custom domain，再到 DNS 加一筆 CNAME 指到 `<你的帳號>.github.io`。

上線後把 `index.html` 裡 `og:image` 改成完整網址（例如 `https://<你的帳號>.github.io/goodfood-links/assets/img/og-image.png`），
分享到 LINE / Facebook 才會有預覽圖。

也可以不經 GitHub：把整個資料夾拖進 Netlify Drop（app.netlify.com/drop）就上線。

## 4. 調整

- **顏色**：`assets/css/style.css` 最上方的 `:root` 變數（紙米 `--paper`、墨 `--ink`、磚橘 `--brick` 為唯一強調色）。
- **載入動畫**：`assets/js/config.js` 的 `loaderSpeed`（速度）、`loaderEvery`（是否每次都播）。
  動畫本體與時間軸在 `assets/js/loader.js` 的 `tracks`。
- 沒有任何分析／追蹤程式；影片使用 `youtube-nocookie.com`，按播放鍵才載入播放器。
