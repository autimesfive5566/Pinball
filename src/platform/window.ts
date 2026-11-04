import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { PauseReason } from '../runtime/fixed-step';

export async function bindWindow(
  pause: (reason: PauseReason, paused: boolean) => void,
  report: (message: string) => void,
): Promise<void> {
  const minimize = document.querySelector<HTMLButtonElement>('#minimize')!;
  const close = document.querySelector<HTMLButtonElement>('#close')!;
  if (!isTauri()) {
    minimize.disabled = close.disabled = true;
    report('瀏覽器預覽；桌面透明與視窗操作未驗證');
    return;
  }
  const native = getCurrentWindow();
  document.querySelector<HTMLElement>('#drag-region')!.addEventListener('pointerdown', (event) => {
    if (event.button === 0 && event.isPrimary) {
      void native.startDragging().catch(() => report('拖曳失敗'));
    }
  });
  const reconcile = async () => {
    try {
      pause('minimized', await native.isMinimized());
      pause('platform-error', false);
    } catch {
      pause('platform-error', true);
      report('無法讀取視窗狀態，物理已暫停');
    }
  };
  minimize.addEventListener('click', () => {
    pause('window-operation', true);
    void native.minimize().catch(() => report('最小化失敗')).finally(async () => {
      await reconcile(); pause('window-operation', false);
    });
  });
  close.addEventListener('click', () => { void native.close().catch(() => report('關閉失敗，請使用 Alt+F4')); });
  const cleanups = await Promise.all([
    native.onResized(() => { void reconcile(); }),
    native.onFocusChanged(() => { void reconcile(); }),
  ]);
  // visibilitychange 不保證涵蓋 WebView2 最小化；輪詢補足，原生仍待 Windows 驗收。
  const timer = window.setInterval(() => { void reconcile(); }, 250);
  window.addEventListener('pagehide', () => {
    window.clearInterval(timer); cleanups.forEach((off) => off());
  }, { once: true });
  report('Phase 0 · Windows 透明與效能待驗收');
  await reconcile();
}
