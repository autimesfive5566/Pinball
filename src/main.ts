import './style.css';
import { isTauri } from '@tauri-apps/api/core';
import { BOARD, type PhysicsHz } from './config';
import { PhysicsScene } from './physics/scene';
import { bindWindow } from './platform/window';
import { CanvasRenderer } from './render/canvas';
import { FixedStepLoop } from './runtime/fixed-step';
import { Metrics } from './runtime/metrics';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element<HTMLOutputElement>('status');
const report = (message: string) => { status.textContent = message; };

try {
  const scene = new PhysicsScene();
  const renderer = new CanvasRenderer(element<HTMLCanvasElement>('board'));
  let metrics = new Metrics();
  let capture: { start: number; measuring: boolean; drops: number } | null = null;
  let exportData: unknown = null;
  let lastDisplay = 0;
  const loop = new FixedStepLoop((dt) => {
    const start = performance.now(); scene.step(dt); metrics.step(performance.now() - start);
  }, () => scene.syncInterpolation());
  const captureButton = element<HTMLButtonElement>('capture');
  const exportButton = element<HTMLButtonElement>('export');
  const hzSelect = element<HTMLSelectElement>('hz');
  const cancelCapture = (reason: string) => {
    if (!capture) return;
    capture = null; captureButton.disabled = hzSelect.disabled = false;
    captureButton.textContent = '記錄 120 秒';
    report(`量測中止：${reason}，請重新記錄`);
  };

  element<HTMLButtonElement>('drop').addEventListener('click', () => {
    scene.reset();
    if (capture) capture.drops += 1;
  });
  element<HTMLButtonElement>('pause').addEventListener('click', (event) => {
    const target = event.currentTarget as HTMLButtonElement;
    const paused = target.getAttribute('aria-pressed') !== 'true';
    loop.setPaused('user', paused); target.setAttribute('aria-pressed', String(paused));
    target.textContent = paused ? '繼續' : '暫停';
    if (paused) cancelCapture('手動暫停');
  });
  hzSelect.addEventListener('change', () => { loop.setFrequency(Number(hzSelect.value) as PhysicsHz); metrics = new Metrics(); });
  const visibility = () => {
    loop.setPaused('visibility', document.hidden);
    if (document.hidden) cancelCapture('頁面不可見');
  };
  document.addEventListener('visibilitychange', visibility);
  visibility();
  element<HTMLInputElement>('debug').addEventListener('change', (event) => {
    element<HTMLOutputElement>('metrics').hidden = !(event.currentTarget as HTMLInputElement).checked;
  });
  captureButton.addEventListener('click', () => {
    if (loop.paused) { report('請先恢復物理，再開始量測'); return; }
    capture = { start: performance.now(), measuring: false, drops: 0 };
    exportData = null; exportButton.disabled = true;
    captureButton.disabled = hzSelect.disabled = true;
  });
  exportButton.addEventListener('click', () => {
    if (!exportData) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `pinball-phase-0-${loop.frequency}hz.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const frame = (now: number) => {
    if (loop.paused) cancelCapture('視窗已暫停');
    if (capture && !capture.measuring && now - capture.start >= 10_000) {
      capture = { start: now, measuring: true, drops: 0 }; metrics = new Metrics();
    }
    const result = loop.frame(now);
    if (!result.paused) metrics.frame(result.frameMs, result.droppedMs);
    const start = performance.now(); renderer.draw(scene.snapshot(), result.alpha);
    if (!result.paused) metrics.drawing(performance.now() - start);
    if (capture) {
      const elapsed = now - capture.start;
      captureButton.textContent = `${capture.measuring ? '記錄' : '暖機'} ${Math.ceil(((capture.measuring ? 120_000 : 10_000) - elapsed) / 1000)}s`;
      if (capture.measuring && elapsed >= 120_000) {
        exportData = {
          capturedAt: new Date().toISOString(), appVersion: '0.1.0', board: BOARD.version,
          mode: isTauri() ? 'tauri' : 'browser', buildMode: import.meta.env.MODE, userAgent: navigator.userAgent,
          hz: loop.frequency, dpr: devicePixelRatio, durationMs: elapsed, manualDrops: capture.drops,
          statistics: metrics.report(),
          evidence: '僅量測數據；OS/GPU/WebView2/刷新率及原生透明須另外記錄，不能自動判定通過',
        };
        capture = null; exportButton.disabled = false; captureButton.disabled = hzSelect.disabled = false;
        captureButton.textContent = '記錄 120 秒'; report('量測完成，可匯出；請另記機器與視窗設定');
      }
    }
    if (now - lastDisplay >= 500) {
      lastDisplay = now;
      if (!element<HTMLOutputElement>('metrics').hidden) {
        const r = metrics.report(); const s = scene.snapshot();
        element<HTMLOutputElement>('metrics').textContent = [
          `${r.fps?.toFixed(1) ?? '—'} FPS · ${loop.frequency} Hz · DPR ${devicePixelRatio}`,
          `frame p95 ${r.frame.p95Ms?.toFixed(2) ?? '—'} ms · step p95 ${r.physics.p95Ms?.toFixed(3) ?? '—'} ms`,
          `draw p95 ${r.draw.p95Ms?.toFixed(3) ?? '—'} ms · 丟棄 ${r.droppedMs.toFixed(1)} ms`,
          `tick ${s.tick} · 碰釘 ${s.pegContacts} · ${s.bodyCount} body / ${s.fixtureCount} fixture`,
          loop.paused ? `暫停：${loop.pauseReasons.join(', ')}` : `速度 ${s.speed.toFixed(2)} m/s`,
        ].join('\n');
      }
    }
    requestAnimationFrame(frame);
  };
  void bindWindow((reason, paused) => loop.setPaused(reason, paused), report).catch(() => {
    loop.setPaused('platform-error', true); report('原生視窗初始化失敗，物理已暫停');
  });
  requestAnimationFrame(frame);
} catch (error) {
  report(`初始化失敗：${error instanceof Error ? error.message : String(error)}`);
}
