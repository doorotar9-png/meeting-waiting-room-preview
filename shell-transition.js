// Keep the displayed document until its replacement has rendered the target.
let подготовка = null;
let таймерПодготовки = 0;
let ошибкаПерехода = null;

function отменитьПодготовку() {
  clearTimeout(таймерПодготовки);
  подготовка?.remove();
  подготовка = null;
  ошибкаПерехода?.remove();
  ошибкаПерехода = null;
  рамка.removeAttribute('aria-busy');
  окно.inert = false;
}

function показатьПодготовленное(следующее) {
  if (подготовка !== следующее) return;
  clearTimeout(таймерПодготовки);
  const прежнее = окно;
  прежнее.removeAttribute('id');
  следующее.id = 'window';
  следующее.classList.remove('sh-preparing-frame');
  следующее.removeAttribute('aria-hidden');
  следующее.removeAttribute('tabindex');
  следующее.inert = false;
  окно = следующее;
  подготовка = null;
  прежнее.remove();
  рамка.removeAttribute('aria-busy');
}

function подготовитьОкно(адрес, html = false) {
  отменитьПодготовку();
  // Initial loading keeps Storybook's own loader; there is no previous view yet.
  if (!окно.getAttribute('src') && !окно.getAttribute('srcdoc')) {
    if (html) окно.srcdoc = адрес;
    else окно.src = адрес;
    return;
  }
  const следующее = document.createElement('iframe');
  следующее.id = 'window-next';
  следующее.title = окно.title || 'Окно звонка';
  следующее.setAttribute('allow', окно.getAttribute('allow') || 'fullscreen');
  следующее.className = 'sh-preparing-frame';
  следующее.setAttribute('aria-hidden', 'true');
  следующее.setAttribute('tabindex', '-1');
  следующее.inert = true;
  подготовка = следующее;
  рамка.append(следующее);
  вписать(); // Device profile and native viewport must exist before loading.
  рамка.setAttribute('aria-busy', 'true');
  окно.inert = true;
  таймерПодготовки = setTimeout(() => {
    if (подготовка !== следующее) return;
    отменитьПодготовку();
    ошибкаПерехода = эл('div', 'sh-transition-error', 'Не удалось открыть выбранное состояние. ');
    ошибкаПерехода.setAttribute('role', 'status');
    const повтор = эл('button', '', 'Повторить');
    повтор.type = 'button';
    повтор.onclick = () => подготовитьОкно(адрес, html);
    ошибкаПерехода.append(повтор);
    рамка.append(ошибкаПерехода);
  }, 30000);
  if (html) {
    следующее.onload = () => показатьПодготовленное(следующее);
    следующее.srcdoc = адрес;
  } else следующее.src = адрес;
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || !подготовка || event.source !== подготовка.contentWindow) return;
  if (event.data?.type === 'prototype-frame-ready') показатьПодготовленное(подготовка);
});
