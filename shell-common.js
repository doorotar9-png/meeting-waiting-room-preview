// Оболочка прототипа: помощники для shell.js.
// Размер окна продукта выбирается независимо от постоянно видимой панели.
const рамка = document.getElementById('frame');
let окно = document.getElementById('window');
const панель = document.getElementById('panel');
const место = document.getElementById('stage');
const РАЗМЕРЫ = [
  { id: 'desktop', имя: 'Компьютер', подпись: 'монитор', ширина: 1600, высота: 900 },
  { id: 'tablet', имя: 'Планшет', подпись: 'планшет', ширина: 768, высота: 1024 },
  { id: 'phone', имя: 'Телефон', подпись: 'телефон', ширина: 390, высота: 844 },
  { id: 'custom', имя: 'Свой', ширина: 1600, высота: 900 },
];
let размерОкна = 0;
const свойРазмер = { ширина: '', высота: '' };
const размерДоВвода = { ширина: РАЗМЕРЫ[0].ширина, высота: РАЗМЕРЫ[0].высота };

function корректныйРазмер(значение) {
  return значение === '' || (/^\d+$/.test(значение) && Number(значение) > 0 && Number(значение) <= 16384);
}

/** Фрейм получает выбранный viewport, масштаб меняет только показ макета. */
function вписать() {
  const размер = РАЗМЕРЫ[размерОкна];
  const зазор = parseFloat(getComputedStyle(document.body).columnGap);
  const доступнаяШирина = document.body.clientWidth - панель.offsetWidth - зазор;
  const k = Math.max(0, Math.min(1, доступнаяШирина / размер.ширина, место.clientHeight / размер.высота));
  рамка.style.width = размер.ширина * k + 'px';
  рамка.style.height = размер.высота * k + 'px';
  for (const кадр of рамка.querySelectorAll('iframe')) {
    кадр.style.width = размер.ширина + 'px';
    кадр.style.height = размер.высота + 'px';
    кадр.style.transform = 'scale(' + k + ')';
    if (кадр.dataset.device !== размер.id) {
      кадр.dataset.device = размер.id;
      // Same-origin preview changes capabilities in place, preserving the call.
      кадр.contentWindow?.dispatchEvent(new Event('prototype-device-change'));
    }
  }
}

new ResizeObserver(вписать).observe(document.documentElement);

function эл(тег, класс, текст) {
  const e = document.createElement(тег);
  if (класс) e.className = класс;
  if (текст !== undefined) e.textContent = текст;
  return e;
}

/**
 * Заполнение окна — сколько людей зову, как принято у макетов (решение
 * владельца, 18 сентября 2026). Пустое — 1 на 1. Числа — у плеера
 * (`player.tsx`, `ЗОВУ`); здесь пункты и их имена в адресе окна.
 */
const ЗАПОЛНЕНИЕ = [
  ['Пустое представление', ''],
  ['Типовое', 'typical'],
  ['Максимальное', 'max'],
];

const МОНИТОР =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="2" y="2.5" width="12" height="8.5" rx="1.5"/><path d="M8 11v2.5M5.5 13.5h5"/></svg>';

const ИКОНКИ_УСТРОЙСТВ = [
  МОНИТОР,
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5"/><path d="M7 12h2"/></svg>',
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><rect x="4" y="1.5" width="8" height="13" rx="1.5"/><path d="M7 12h2"/></svg>',
];

/**
 * Выпадающий список — тот же уровень фильтра, что `фильтр`, когда пунктов
 * много: выбор сценария. Список настоящий, браузерный: клавиатура и чтение
 * экраном работают как у любого `<select>`.
 */
function выпадающий(заголовок, имя, пункты, выбран, выбрать) {
  const блок = эл('section', 'sh-filter');
  блок.append(эл('h2', 'sh-filter-title', заголовок));
  const обёртка = эл('div', 'sh-filter-list');
  const стрелка = эл('label', 'sh-select');
  const выбор = эл('select');
  выбор.name = имя;
  выбор.setAttribute('aria-label', заголовок);
  пункты.forEach((текст, i) => выбор.append(new Option(текст, String(i), false, i === выбран)));
  выбор.addEventListener('change', () => выбрать(Number(выбор.value)));
  стрелка.append(выбор);
  обёртка.append(стрелка);
  блок.append(обёртка);
  return блок;
}

/** Блок панели с текстом вместо переключателей: у черновика шагов ещё нет. */
function заметка(заголовок, строки) {
  const блок = эл('section', 'sh-filter');
  блок.append(эл('h2', 'sh-filter-title', заголовок));
  const список = эл('div', 'sh-filter-list');
  строки.forEach((с) => список.append(эл('p', 'sh-note', с)));
  блок.append(список);
  return блок;
}

/** Размер окна звонка: выбор сохраняется при смене сценария. */
function шапкаУстройства() {
  const устройство = эл('div', 'sh-device');
  const ряд = эл('div', 'sh-device-row');
  ряд.setAttribute('role', 'group');
  ряд.setAttribute('aria-label', 'Размер окна звонка');
  [2, 1, 0, 3].forEach((i) => {
    const размер = РАЗМЕРЫ[i];
    const чип = эл('button', 'sh-size-chip' + (размер.id === 'custom' ? ' sh-size-chip-custom' : ''));
    чип.type = 'button';
    чип.name = 'size';
    чип.value = String(i);
    чип.title = размер.имя;
    чип.setAttribute('aria-label', размер.имя);
    чип.setAttribute('aria-pressed', String(i === размерОкна));
    if (размер.id === 'custom') чип.textContent = размер.имя;
    else чип.innerHTML = ИКОНКИ_УСТРОЙСТВ[i];
    чип.addEventListener('click', () => {
      if (размер.id === 'custom' && размерОкна !== i) {
        const текущий = РАЗМЕРЫ[размерОкна];
        ['ширина', 'высота'].forEach((ось) => {
          размер[ось] = размерДоВвода[ось] = текущий[ось];
          свойРазмер[ось] = '';
        });
      }
      размерОкна = i;
      вписать();
      запомнить();
      нарисовать();
    });
    ряд.append(чип);
  });
  const размер = РАЗМЕРЫ[размерОкна];
  устройство.append(ряд);
  if (размер.id === 'custom') {
    const поля = эл('div', 'sh-custom-size');
    const ошибка = эл('div', 'sh-size-error', 'Введите целые размеры от 1 до 16384 пикселей.');
    ошибка.id = 'size-error';
    ошибка.setAttribute('role', 'status');
    ошибка.hidden = Object.values(свойРазмер).every(корректныйРазмер);
    ['ширина', 'высота'].forEach((ось, i) => {
      if (i) поля.append(эл('span', '', '×'));
      const поле = эл('input', 'sh-size-input');
      Object.assign(поле, { type: 'text', inputMode: 'numeric', name: 'size-' + ось,
        value: свойРазмер[ось], placeholder: String(размерДоВвода[ось]), autocomplete: 'off' });
      поле.setAttribute('aria-label', i ? 'Высота окна' : 'Ширина окна');
      поле.setAttribute('aria-describedby', ошибка.id);
      поле.setAttribute('aria-invalid', String(!корректныйРазмер(свойРазмер[ось])));
      поле.addEventListener('input', () => {
        свойРазмер[ось] = поле.value;
        поле.setAttribute('aria-invalid', String(!корректныйРазмер(поле.value)));
        ошибка.hidden = Object.values(свойРазмер).every(корректныйРазмер);
        if (!ошибка.hidden) return;
        размер.ширина = Number(свойРазмер.ширина || размерДоВвода.ширина);
        размер.высота = Number(свойРазмер.высота || размерДоВвода.высота);
        вписать();
        запомнить();
      });
      поля.append(поле);
    });
    поля.append(эл('span', '', 'пикс.'));
    устройство.append(поля, ошибка);
  } else {
    устройство.append(эл('div', 'sh-device-size', размер.ширина + '×' + размер.высота + ' ' + размер.подпись));
  }
  return устройство;
}

/** Фильтр: заголовок и переключатели. Выбрать можно и выбранный — начать заново. */
function фильтр(заголовок, имя, пункты, выбран, выбрать, заблокирован = false) {
  const блок = эл('section', 'sh-filter');
  блок.append(эл('h2', 'sh-filter-title', заголовок));
  const список = эл('div', 'sh-filter-list');
  список.setAttribute('role', 'radiogroup');
  список.setAttribute('aria-label', заголовок);
  пункты.forEach((текст, i) => {
    const пункт = эл('label', 'sh-radio');
    const радио = эл('input');
    Object.assign(радио, { type: 'radio', name: имя, value: String(i), checked: i === выбран, disabled: заблокирован });
    радио.addEventListener('click', () => выбрать(i));
    пункт.append(радио, эл('span', '', текст));
    список.append(пункт);
  });
  блок.append(список);
  return блок;
}
