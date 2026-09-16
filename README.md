# 日日好食｜官方連結頁

純 HTML / CSS / JS 的靜態連結頁（取代 Linktree），沒有任何第三方追蹤。
內容由 **Google 試算表**管理：在試算表改標題、連結、圖片，重新整理網頁就會更新。

- **線上網址**：<https://links.goodfoodeveryday.tw/>（GitHub Pages 原網址 goodfoodeveryday2020.github.io 會自動轉過來）
- **內容試算表**：分頁「設定」「連結」「說明」，使用方式寫在「說明」分頁裡
- **GitHub repo**：`goodfoodeveryday2020/goodfoodeveryday2020.github.io`（Pages 來源 main / root）

```
goodfood-links/
├─ index.html                頁面 + 內建快照（試算表讀不到時的後備資料）
├─ assets/
│  ├─ css/style.css          樣式（顏色在最上方 :root 變數）
│  ├─ js/config.js           ★ 試算表 ID 與載入動畫設定
│  ├─ js/loader.js           載入動畫：「食」書寫 → 上色 → 飛入頁首（3.2 秒）
│  ├─ js/app.js              讀試算表 CSV → 渲染
│  ├─ fonts/                 品牌字型子集（僅「日日好食控麵」五字）
│  └─ img/                   logo、CI 字標、favicon、連結縮圖（links/）
├─ sheets/設定.csv            匯入試算表用的範本
├─ sheets/連結.csv            同上
├─ sheets/說明.csv            試算表「說明」分頁的範本
└─ tools/update-snapshot.py  把試算表現況寫回 index.html 的內建快照
```

## 日常使用

改內容只要動試算表，不用碰這個 repo。詳細欄位說明在試算表的「說明」分頁。

重點：

- 分頁名稱「設定」「連結」不能改，共用權限必須維持「知道連結的任何人、檢視者」。
- 縮圖建議正方形 180×180 以上，會自動裁切置中。影片留空會自動抓 YouTube 封面。
- 沒有縮圖的連結會顯示品牌圓標，不會破圖。
- 「顯示」欄填「否」就能暫時下架某一列。

## 本機預覽

```bash
cd goodfood-links && python3 -m http.server 8080
```

開 <http://localhost:8080/>。直接雙擊 `index.html` 也看得到畫面，但瀏覽器在 `file://` 下不會去讀試算表。

## 更新線上版

目前這台電腦沒有設定 GitHub 推送憑證，所以是用 GitHub 網頁上傳的。
改好檔案後到 repo 頁面 **Add file → Upload files**，拖進對應資料夾再 Commit 即可，
Pages 會在一兩分鐘內自動重新部署。

之後若要改用指令推送，在這個資料夾執行：

```bash
git remote add origin https://github.com/goodfoodeveryday2020/goodfoodeveryday2020.github.io.git
```

然後設定 SSH 金鑰或個人存取權杖，再 `git push -u origin main`。

## 更新內建快照（選用）

試算表讀不到時（斷網、權限被改），頁面會退回 `index.html` 內建的快照。
想把目前試算表的內容固化成新的快照：

```bash
python3 tools/update-snapshot.py
```

## 換自訂網域時要一起改的地方

1. GitHub repo → Settings → Pages → Custom domain 填新網域，勾 Enforce HTTPS。
2. DNS 加一筆 CNAME 指到 `goodfoodeveryday2020.github.io`。
3. `index.html` 的 `og:image` 與 `og:url` 換成新網域（影響分享預覽圖）。
4. 試算表「連結」分頁「預覽」欄公式裡的網址換成新網域（只影響試算表內的預覽）。

## 調整外觀

- **顏色**：`assets/css/style.css` 最上方的 `:root` 變數。紙米 `--paper`、墨 `--ink`、磚橘 `--brick` 是唯一強調色。
- **載入動畫**：`assets/js/config.js` 的 `loaderSpeed`（1 = 4 秒原速，目前 1.25 = 3.2 秒）與 `loaderEvery`（是否每次載入都播）。動畫時間軸在 `assets/js/loader.js` 的 `tracks`。
- **頁首字標**：用橫式 CI logo 抽出的向量。試算表「名稱」改成非「日日好食」時會自動退回文字版。

沒有任何分析或追蹤程式。影片使用 `youtube-nocookie.com`，按下播放鍵才載入播放器。
