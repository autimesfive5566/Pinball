# 接手進度與決策紀錄

最後更新：2026-11-04。唯一進度入口；需求看 `REQUIREMENTS.md`，方案看 `DESIGN.md`，階段 gate 看 `ROADMAP.md`。

## 1. 現在在哪裡

**Phase 0 已開始：跨平台落球原型與前端驗證已完成，Tauri 原生建置／Windows gate 尚未通過。** 沒有投注、倍率、完整軌道、80 釘或 12 球道，未開始 Phase 1。

**使用者已確認**：先要求「請開始 Phase 0，範圍以 docs/ROADMAP.md 為準」，其後於 2026-11-04 明確要求「請照你的建議執行」，授權將這輪 Phase 0 成果提交並推送至既有儲存庫的 `main`。此提交保存階段進度；Windows gate 仍未通過，手動 CI 尚未執行。

## 2. 實際成果與證據

- [x] 取回並讀完六份既有文件，保留文件基準及原有 Git 歷史。
- [x] Vanilla TypeScript／Vite／Tauri 最小來源與最小視窗權限；260×420 透明設定、獨立拖曳、最小化、關閉及 NRB A/B 設定。
- [x] `phase-0-v1`：8 顆靜態釘、封閉外框、一顆真正 Planck 球及原球重置。2 bodies／13 fixtures；沒有 Game 規則模組。
- [x] 固定 60／120 Hz、追趕上限、截斷／丟時間記錄、原因集合暫停、恢復清時鐘／插值、DPR backing store。
- [x] 預設隱藏的量測、10 秒暖機／120 秒記錄、暫停中止、JSON 匯出；FPS、frame／physics／draw p50／p95／p99、慢幀及丟時間。
- [x] 固定 Node 24.19.0／npm 11.9.0 與 npm 精確版本／lockfile；`npm ci`、型別、22 個單元測試及前端 production build 通過。
- [x] Chromium 四種 DPR（1／1.25／1.5／2）驗證 Canvas／CSS Alpha、控制、暫停／恢復、60／120 Hz 切換、重落及匯出；無頁面 JS 錯誤。使用虛擬時鐘，**不是 FPS 證據**。
- [x] 安裝 Rust 1.99.1、rustfmt 通過、Cargo.lock 解析成功；Tauri 2.12.4 schema 與權限名稱對照通過。
- [x] Windows release／NRB 雙組手動 GitHub Actions 工作流程已建立，**尚未執行**。
- [ ] Tauri 原生編譯通過：Linux 嘗試建置停在缺 `glib-2.0.pc`，另確認缺 GTK／WebKitGTK 開發套件；屬環境受限，沒有原生產物。
- [ ] Windows x64 release 執行檔、Win10／Win11 DWM／WebView2 真透明、閃白／殘影、拖曳／關閉／最小化、實際跨 DPI、恢復順序及效能驗收。
- [ ] NRB 開／關實機比較、60／120 Hz 透明 release 效能比較；Phase 0 整體 gate 仍未通過。

完整命令、版本、PASS／受限／未測、已修正問題及證據在 [Phase 0 驗證報告](validation/phase-0.md)。程式指紋在 [來源 SHA256](validation/phase-0-source-sha256.txt)。

## 3. 工作區與環境

- 現有 checkout：`/workspace/Pinball`，遠端 `https://github.com/autimesfive5566/Pinball.git`。本輪沒有另建 worktree。
- 啟動時本機 `work` 無 commit、只有 `.git`；GitHub 六份文件實際存在。預設 sandbox 的代理連線失敗，使用允許網路的執行設定後，HTTPS Git 連線正常；不是儲存庫遺失。
- 取回遠端 HEAD **3845f228b5f581bd318350aa3e1b4dfee72d482b**（文件基準），將原本空的 `work` 接到此提交；接續前沒有任何使用者變更。
- 本次以 `feat: add Phase 0 prototype and validation` 提交上述基準之上的來源、設定、lockfiles、測試與文件；本機分支為 `work`，推送目標為 `origin/main`。同步以提交後的本機 HEAD 與遠端 `refs/heads/main` SHA 對照，不能單憑本檔宣稱推送成功。沒有觸發 CI、發布或修改雲端設定草稿。
- 保存前再次核對遠端 `main` 仍為上述文件基準，30 份來源指紋與已驗證版本一致；沿用 22 項測試及四種 DPR 瀏覽器驗證的證據。本輪保存只修訂交接文字，另檢查文件與提交範圍。
- Debian 13 x86_64／Linux 6.18.57。Windows、MSVC／SDK、WebView2、DWM 與桌面 GPU 驗收資源本輪未取得。
- 中間 cache、Rust 工具鏈、log、瀏覽器截圖與虛擬量測位於被忽略的 `work/`，原生中間產物在被忽略的 `src-tauri/target/`；不要當成已保存到 Git 的 release。
- 前端依賴組合已驗證；Rust 工具鏈只驗證安裝、格式及依賴解析，**不能稱整組原生相容通過**。

## 4. 決策狀態

使用者確認的正式規則以 REQUIREMENTS 為準。本輪保持 Phase 0 排除範圍；沒有修改投注／獎勵／公平性需求。

下列為**已提出但未逐項確認的建議**，可以在授權的相應階段作初始可調預設，不要稱真實機台標準：

| 優先 | 項目 | 建議預設／待補證據 | 狀態 |
| --- | --- | --- | --- |
| P0 | Windows驗證資源 | Windows x64建置，Win10／Win11實機驗收 | 尚未取得／確認方式 |
| P0 | 本輪實作範圍 | 僅 Phase 0 | 使用者已授權並開始；原生 gate 未通過 |
| P1 | 技術棧 | 先 Tauri 2，重大問題才比較 Electron | 前端已測，原生整合未通過 |
| P1 | 滑鼠穿透 | 首版不做 | 建議 |
| P1 | 大小 | 260×420，可讀性不足再300×480 | 暫定 |
| P1 | 弱發射 | RETRY_READY原局重發，不能加碼 | 設計細化 |
| P1 | 卡球／出界 | 技術作廢退款，不指定落點 | 待確認產品策略 |
| P1 | 發射 | 滑鼠40px拉桿、Space蓄力 | 建議 |
| P1 | 停燈／燈位 | 最近繪製倍率；seeded不重複抽燈、允許相鄰 | 建議 |
| P2 | 初始餘額／存檔 | 100，僅會話保留，跨啟動先不存 | 待確認 |
| P2 | 釘位／材質 | 80釘交錯及DESIGN初始係數 | 未物理驗證 |
| P2 | 跑燈速度 | 160ms／格、無權重／自停 | 建議 |
| P2 | Step | 60 Hz 起步，比較 120 Hz／CCD | 60／120 Hz 行為已測；原生效能及 CCD 對照未測 |
| P2 | 系統匣 | Phase3，真正隱藏前保證恢復入口 | 建議 |
| P2 | 全域快捷鍵 | 預設不綁，可自訂／停用 | 建議 |
| P3 | 置頂 | 預設關，可選開 | 建議 |
| P3 | 安裝是否離線 | 遊戲離線；安裝WebView2路徑Phase5定 | 待決定 |

真實機台未知資訊不因接受初始設計就變已知。版本研究metadata也不變成已驗證的套件組合。

## 5. 下一輪如何接續

1. 讀 AGENTS／本檔，核對來源指紋及 Git 狀態，不重新建立空白專案。
2. 先完成 Windows x64 原生 build：本機依 README 裝好 MSVC／SDK／WebView2，或在使用者後續授權觸發後使用手動工作流程。工作流程尚未執行，不能引用為通過證據。
3. 保存一般／NRB 兩份 release 與 SHA，按 ROADMAP 第 8、9 節在 Win10 22H2／Win11 測透明、啟動、操作及 100／125／150%／跨螢幕 DPI。
4. 透明 release、DevTools 關閉、60Hz 顯示器，暖機 10 秒後至少量測 120 秒並多次落球；分別記錄 60／120 Hz、NRB 關／開、硬體／OS／WebView2／刷新率／DPI。虛擬時鐘輸出不能填入效能通過欄。
5. 尤其重測外部工作列最小化／恢復、原生拖曳與休眠的事件次序，確認沒有恢復追算；目前只有控制器／瀏覽器證據。
6. Windows gate 沒通過前，不宣稱 Phase 0 完成、不擴入完整球盤。重大透明缺陷須先排錯，才按 DESIGN 的門檻比較 Electron。
7. 更新同一份 validation 報告與本檔；後續修改依當輪授權提交／推送，不默認工作區變更已同步。

## 6. 重要歷史

| 日期 | 事件 | 影響 |
| --- | --- | --- |
| 2026-11-03 | 最初要求雲端onboarding，查得空儲存庫 | 沒有可安裝專案，不是既有程式故障 |
| 2026-11-03 | 使用者說明是新專案、分段交付完整需求 | 改為新遊戲的分析與規劃 |
| 2026-11-03 | 需求交付完後完成規劃回覆；環境中斷 | 沒有原型，前輪寫檔未完成 |
| 2026-11-03 | 使用者授權建立接手文件，本輪補齊 | 進度與規格可由checkout恢復 |
| 2026-11-04 | 使用者明確要求提交並推送六份文件，以main建立初始文件基準 | 新checkout可透過Git取得；是否同步以本機／遠端SHA核對 |
| 2026-11-04 | 使用者明確要求開始 Phase 0；完成跨平台原型及前端驗證 | 原生／Windows gate 保留，未進 Phase 1 |
| 2026-11-04 | 使用者要求照建議提交並推送 Phase 0 成果 | 本次進度提交目標為 main；Windows gate 與手動 CI 狀態保持未通過／未執行 |

## 7. 本輪文件檢查

文件及程式的實際驗證命令／結果集中於 [Phase 0 報告](validation/phase-0.md)。保留需求、方案、gate、進度的分工；沒有把 npm build、瀏覽器截圖或 Cargo.lock 當成 Windows 實機通過。接手時應重新核對實際狀態，不延用舊 PASS。
