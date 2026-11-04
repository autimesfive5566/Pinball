# Pinball：台灣夜市小鋼珠彈珠台模擬器

Windows 10／11 的小型透明桌面遊戲。以一顆物理鋼珠的實際落點，決定本局投入的虛擬鋼珠獎勵。

**Phase 0 已建立最小落球原型，可執行瀏覽器驗證；Windows release、桌面透明與 60 FPS gate 尚未通過。** 實際證據見 [Phase 0 驗證報告](docs/validation/phase-0.md)，進度以 [STATUS](docs/STATUS.md) 為準。

候選技術：TypeScript、Tauri 2、Vite、Canvas 2D、Planck、WebView2。先做技術原型，再逐階段開發；不一次生成完整遊戲。

## 文件入口

| 文件 | 用途 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 後續代理人必讀規範、閱讀順序與更新責任 |
| [目前進度](docs/STATUS.md) | 已完成、未完成、決策狀態、限制與下一步；接手先讀 |
| [需求基準](docs/REQUIREMENTS.md) | 使用者第 0～18 節需求的整理，區分確認與未知 |
| [技術設計](docs/DESIGN.md) | 架構、型別、狀態機、物理初始值、風險及技術來源 |
| [階段與驗收](docs/ROADMAP.md) | Phase 0～5、測試矩陣、實作範圍與完成條件 |

這些文件是任務的長期記憶；對話壓縮後不應靠猜測補回進度。需求基準記錄「要做什麼」，設計記錄「建議怎麼做」，進度記錄「實際做到了哪裡」，避免把規劃當成成果。

## 恢復任務

下一輪對話可貼：

> 請接手 Pinball，先讀 AGENTS.md、docs/STATUS.md，再依需要讀其他文件並核對工作區實際狀態。保留既有成果，不重做已完成工作。這輪請先回報目前進度與下一個可執行步驟，不要自行擴大到完整遊戲實作。

若確定要開始下一階段，最後一句改成：

> 這輪請開始 Phase 0，僅實作 docs/ROADMAP.md 的 Phase 0 範圍；遇到 Windows 實測限制時先完成可獨立完成的工作，明確列出未驗證項目。

兩種指示意義不同：單純恢復上下文不代表已要求開始實作。

## 保存範圍

既有六份接手文件及本次 Phase 0 原型、設定、lockfiles、測試與驗證紀錄納入 Git 版本管理，目標分支為 `main`。新對話應開啟 `autimesfive5566/Pinball` 的 `main`，先確認文件已取得，再依上述順序閱讀；對話本身不會自動繼承。

提交保存在本機 Git，推送才會同步到 GitHub；遠端是否同步可比對本機 `HEAD` 與遠端 `refs/heads/main`。Git 推送不等於發布雲端環境或遊戲。

## 開發與驗證

固定 Node **24.19.0**、npm **11.9.0**；Rust 工具鏈見 `rust-toolchain.toml`。在儲存庫根目錄執行：

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

本輪已驗證 npm ci、型別、22 個單元測試、production build 及 production preview；雲端 npm cache 使用 `--cache ./work/npm-cache`。開發伺服器為 `http://127.0.0.1:1420`。瀏覽器中的關閉／最小化刻意停用；它只驗證前端，不能代表 Windows 透明通過。

原型提供重新落球、暫停／繼續及 60／120Hz 切換。量測預設隱藏；按「記錄 120 秒」先暖機 10 秒，再收集 120 秒，期間多次手動重落。最小化／暫停會取消量測，完成後可匯出 JSON。沒有投注、倍率、完整軌道或球道。

瀏覽器檢查需可用的 Chromium。先於一個終端執行 `npm run preview`，再於本輪 Linux 環境執行：

```sh
PINBALL_CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

其他機器可將 `PINBALL_CHROMIUM_PATH` 指向已安裝的 Chromium，或使用 Playwright 自帶瀏覽器。此測試用虛擬時間驗證互動與匯出流程，不提供效能證據。

## Windows 原型建置與待驗收

需 Windows x64、Microsoft C++ Build Tools／Windows SDK、Rust MSVC、WebView2。以下腳本已建立；Windows CI 曾因缺少原生圖示失敗，本機已補修正，**成功建置與原生執行仍待驗證**：

```sh
npm run desktop:dev
npm run desktop:build
npm run desktop:build:nrb
```

兩種 release 都輸出 `src-tauri/target/release/pinball.exe`；先保存一般組，才建置 NRB 組，避免覆蓋。這是 Phase 0 執行檔，尚無安裝包。Linux 原生建置因缺 GLib／GTK／WebKitGTK 開發套件受限。

另提供手動 GitHub Actions 工作流程 `Phase 0 Windows release prototype`，用於產出 NRB 關／開兩份 exe、SHA256 與建置版本資訊。缺圖示修正同步後，應以修正所在的新提交／分支按 **Run workflow**；舊執行的 **Re-run jobs** 仍使用舊提交。建置成功後，依 [ROADMAP](docs/ROADMAP.md) 第 8、9 節在 Win10／Win11 實機檢查透明、DPI、操作及效能；修正紀錄見 [Phase 0 報告](docs/validation/phase-0.md)。
