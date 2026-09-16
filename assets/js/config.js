/* 日日好食｜官方連結頁 設定
   把 Google 試算表設為「知道連結的任何人可檢視」後，
   將網址 https://docs.google.com/spreadsheets/d/【這一串】/edit 中的 ID 貼到 sheetId。 */
window.GF_CONFIG = {
  sheetId: "1lEUHhK679Gj-lpAN9p5eqEMrHFBi01USQGW7tDlNbiI",  // 留空 = 只用 index.html 內建的快照資料
  settingsSheet: "設定",  // 「設定」分頁名稱（欄位：項目、內容）
  linksSheet: "連結",     // 「連結」分頁名稱（欄位：順序、類型、標題、連結、圖片、顯示方式、顯示）
  loaderSpeed: 1.25,      // 載入動畫速度：1 = 原速 4 秒；1.25 = 縮短 20%（約 3.2 秒）
  loaderEvery: true,      // true = 每次載入都播完整動畫；false = 同一個分頁只播第一次
  maxWait: 8000           // 最多等待試算表幾毫秒，逾時先以快照顯示
};
