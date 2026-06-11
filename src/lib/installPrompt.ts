// Single source of truth for the beforeinstallprompt event.
// Import this module once and it registers the listener globally.

let _prompt: any = null;
const _listeners: Array<(p: any) => void> = [];

function init() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _prompt = e;
    _listeners.forEach((fn) => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    _prompt = null;
    _listeners.forEach((fn) => fn(null));
  });
}

init();

export function getInstallPrompt() {
  return _prompt;
}

export function onInstallPromptChange(fn: (prompt: any) => void) {
  _listeners.push(fn);
  // Immediately call with current value
  fn(_prompt);
  return () => {
    const i = _listeners.indexOf(fn);
    if (i > -1) _listeners.splice(i, 1);
  };
}

export async function triggerInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!_prompt) return "unavailable";
  const prompt = _prompt;
  _prompt = null; // consume immediately so nothing else can call it
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === "accepted" ? "accepted" : "dismissed";
}
