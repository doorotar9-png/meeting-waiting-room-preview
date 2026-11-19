// Run before the player so even a failed script can end initial loading.
(() => {
  const loader = document.getElementById('prototype-loader');
  const root = document.documentElement;
  if (!loader) return;

  const cancel = window.clearTimeout.bind(window);
  const timer = window.setTimeout(() => {
    observer.disconnect();
    if (root.dataset.prototypeReady === 'true' || !loader.isConnected) return;

    const message = document.createElement('p');
    message.setAttribute('role', 'status');
    message.textContent = 'Не удалось открыть макет';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Повторить';
    retry.onclick = () => location.reload();
    retry.style.cssText = 'cursor:pointer;padding:8px 16px;border:1px solid #cbd2d6;border-radius:6px;background:#fff;color:inherit;font:inherit';
    loader.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font:15px/1.4 Arial,sans-serif;color:#333;background:#fff';
    loader.replaceChildren(message, retry);
  }, 15000);

  const observer = new MutationObserver(() => {
    if (root.dataset.prototypeReady !== 'true') return;
    cancel(timer);
    observer.disconnect();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-prototype-ready'] });
})();
