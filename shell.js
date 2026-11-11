// A page reload starts a fresh demo; opening a shared URL still restores its variant.
const reloading = performance.getEntriesByType('navigation')[0]?.type === 'reload';
const address = new URLSearchParams(reloading ? '' : location.search);
const branches = JSON.parse(document.getElementById('meeting-steps').textContent);
const peopleOptions = ['2', '5', '16'];
const agendaOptions = ['empty', 'typical', 'max'];
const roles = ['employee', 'guest'];
let people = peopleOptions.includes(address.get('people')) ? address.get('people') : '2';
let role = address.get('role') === 'guest' ? 'guest' : 'employee';
let agenda = agendaOptions.includes(address.get('agenda')) ? address.get('agenda') : 'empty';
let files = agenda !== 'empty' && address.get('files') === '1';
let camera = address.get('camera') === 'fill' ? 'fill' : 'inset';
let background = address.get('background') === '1';
let step = Number(address.get('step')) || 0;
if (!branches[role].steps[step]) step = 0;
let openAgendaOnReady = false;
let timerAvailable = false;
let timerButton;
let peopleUpdateId = 0;
let peopleUpdateTimer = 0;
let peopleOnReady = false;

function cancelPeopleUpdate() {
  peopleUpdateId++;
  clearTimeout(peopleUpdateTimer);
}

function changePeople(index) {
  people = peopleOptions[index];
  запомнить();
  if (ошибкаПерехода) {
    openStep(step);
    return;
  }
  if (подготовка || !окно.contentDocument?.documentElement.dataset.prototypeReady) {
    cancelPeopleUpdate();
    peopleOnReady = true;
    return;
  }
  peopleOnReady = false;
  cancelPeopleUpdate();
  const request = peopleUpdateId;
  peopleUpdateTimer = setTimeout(() => {
    if (request === peopleUpdateId) openStep(step);
  }, 1000);
  окно.contentWindow.postMessage({type: 'meeting-people', count: Number(people), request}, location.origin);
}

function panelStepIndex() {
  return Math.max(0, branches[role].panelSteps.findLastIndex(item => item.index <= step));
}

function refreshStepControls() {
  const selected = panelStepIndex();
  панель.querySelectorAll('input[name="step"]').forEach((input, i) => { input.checked = i === selected; });
  const insetSwitch = панель.querySelector('[data-scene-insets-switch]');
  if (insetSwitch) insetSwitch.hidden = selected !== 0;
}

function updateTimerButton() {
  if (!timerButton) return;
  const disabled = !timerAvailable || !!подготовка || !!ошибкаПерехода;
  timerButton.disabled = disabled;
  timerButton.classList.toggle('controls-Button_clickable', !disabled);
  timerButton.classList.toggle('controls-Button_readonly', disabled);
  timerButton.classList.toggle('controls-button_outlined-secondary-style', !disabled);
  timerButton.classList.toggle('controls-button_outlined-readonly-style', disabled);
  timerButton.querySelector('.controls-BaseButton__text')?.classList.toggle('controls-Button__text_readonly_outlined', disabled);
}

// The catalogue device header uses these shared dimensions and callbacks.
размерОкна = Math.max(0, РАЗМЕРЫ.findIndex(size => size.id === address.get('size')));
if (РАЗМЕРЫ[размерОкна].id === 'custom') {
  for (const [axis, key] of [['ширина', 'width'], ['высота', 'height']]) {
    const value = address.get(key);
    if (value && корректныйРазмер(value)) {
      свойРазмер[axis] = value;
      размерДоВвода[axis] = РАЗМЕРЫ[размерОкна][axis] = Number(value);
    }
  }
}

function запомнить() {
  const size = РАЗМЕРЫ[размерОкна];
  const params = new URLSearchParams({people, role, agenda, camera, size: size.id, step: String(step)});
  params.set('files', files ? '1' : '0');
  params.set('background', background ? '1' : '0');
  if (size.id === 'custom') {
    params.set('width', size.ширина);
    params.set('height', size.высота);
  }
  history.replaceState(null, '', '?' + params);
}

function openStep(index) {
  cancelPeopleUpdate();
  peopleOnReady = false;
  step = index;
  timerAvailable = false;
  updateTimerButton();
  refreshStepControls();
  openAgendaOnReady = false;
  const {id, variant, steps} = branches[role];
  const args = 'variant:' + variant + ';step:' + steps[index].вход + ';fill:max';
  подготовитьОкно('frame.html?' + new URLSearchParams({people, role, agenda, camera, background: background ? '1' : '0', files: files ? '1' : '0', id, args}));
  запомнить();
}

function sendAgenda(open) {
  окно.contentWindow.postMessage({type:'meeting-agenda', level:agenda, files, open}, location.origin);
}

function sendCamera() {
  окно.contentWindow.postMessage({type:'meeting-camera', mode:camera}, location.origin);
}

function sendBackground() {
  окно.contentWindow.postMessage({type:'meeting-background', enabled:background}, location.origin);
}

function нарисовать() {
  const active = document.activeElement;
  const filters = эл('div', 'sh-filters');
  const timerControl = эл('div', 'meeting-timer-control');
  timerButton = эл('button', 'controls_theme-default controls-BaseButton controls-Button_bg-same controls-button-style controls-button_outlined-style controls-button_size-default controls-Button_notCircle controls-button_fontsize-m controls-notFocusOnEnter meeting-timer-button');
  timerButton.type = 'button';
  timerButton.setAttribute('aria-label', 'Таймер равен 10 сек');
  const timerWrapper = эл('span', 'controls-BaseButton__wrapper controls-Button__wrapper_viewMode-outlined controls-BaseButton__wrapper_captionPosition_end controls-Button_textAlign-center');
  timerWrapper.append(эл('span', 'controls-BaseButton__text controls-Button__text_viewMode-outlined', 'Таймер равен 10 сек'));
  timerButton.append(timerWrapper);
  updateTimerButton();
  timerButton.addEventListener('click', () => {
    if (подготовка || ошибкаПерехода || !окно.contentDocument?.documentElement.dataset.prototypeReady || !timerAvailable) return;
    окно.contentWindow.postMessage({type:'meeting-countdown-ten'}, location.origin);
  });
  timerControl.append(timerButton);
  const fileSwitch = эл('label', 'meeting-switch meeting-switch--small');
  const fileInput = эл('input');
  fileInput.type = 'checkbox';
  fileInput.name = 'files';
  fileInput.setAttribute('role', 'switch');
  fileInput.checked = files;
  fileInput.disabled = agenda === 'empty';
  fileSwitch.hidden = agenda === 'empty';
  fileInput.addEventListener('change', () => {
    files = fileInput.checked;
    openAgendaOnReady = true;
    запомнить();
    sendAgenda(true);
  });
  fileSwitch.append(fileInput, эл('span', '', 'Файлы'));
  const backgroundSwitch = эл('label', 'meeting-switch');
  const backgroundInput = эл('input');
  Object.assign(backgroundInput, {type:'checkbox', name:'background', checked:background});
  backgroundInput.setAttribute('role', 'switch');
  backgroundInput.addEventListener('change', () => {
    background = backgroundInput.checked;
    запомнить();
    sendBackground();
  });
  backgroundSwitch.append(backgroundInput, эл('span', '', 'Задний фон'));

  const insetSwitch = эл('label', 'meeting-switch');
  insetSwitch.dataset.sceneInsetsSwitch = 'true';
  const insetInput = эл('input');
  Object.assign(insetInput, {type:'checkbox', name:'camera', checked:camera === 'inset'});
  insetInput.setAttribute('role', 'switch');
  insetInput.addEventListener('change', () => {
    camera = insetInput.checked ? 'inset' : 'fill';
    запомнить();
    sendCamera();
  });
  insetSwitch.append(insetInput, эл('span', '', 'Отступы на сцене'));

  const roleControl = фильтр('Со стороны', 'role', ['Авторизованного пользователя', 'Неавторизованного'], roles.indexOf(role), i => {
      role = roles[i];
      openStep(0);
      нарисовать();
    });
  const peopleControl = фильтр('Заполнение участников', 'people', ['1 на 1', 'Типовое', 'Максимальное'], peopleOptions.indexOf(people), i => {
      changePeople(i);
    });
  const agendaControl = фильтр('Заполнение повестки', 'agenda', ['Пустое', 'Типовое', 'Максимальное'], agendaOptions.indexOf(agenda), i => {
      agenda = agendaOptions[i];
      if (agenda === 'empty') files = false;
      fileInput.checked = files;
      openAgendaOnReady = true;
      запомнить();
      sendAgenda(true);
      fileInput.disabled = agenda === 'empty';
      fileSwitch.hidden = agenda === 'empty';
    });
  const agendaHeading = эл('div', 'meeting-filter-heading');
  agendaHeading.append(agendaControl.querySelector('h2'), fileSwitch);
  agendaControl.prepend(agendaHeading);
  const stepControl = фильтр('Шаги сценария', 'step', branches[role].panelSteps.map(item => item.name), panelStepIndex(), i => openStep(branches[role].panelSteps[i].index));
  const stepSwitches = эл('div', 'meeting-step-switches');
  stepSwitches.append(backgroundSwitch, insetSwitch);
  stepControl.append(stepSwitches);
  filters.append(roleControl, peopleControl, agendaControl, stepControl);
  панель.replaceChildren(шапкаУстройства(), filters, timerControl);
  refreshStepControls();
  if (active?.name) {
    const next = Array.from(панель.querySelectorAll('input,button')).find(el => el.name === active.name && el.value === active.value);
    next?.focus({preventScroll:true});
  }
}

function syncStep() {
  if (подготовка || ошибкаПерехода || !окно.contentDocument?.documentElement.dataset.prototypeReady) return;
  const frameAddress = new URLSearchParams(окно.contentWindow.location.search);
  if (frameAddress.get('role') !== role || frameAddress.get('people') !== people) return;
  const args = new URLSearchParams((frameAddress.get('args') || '').replaceAll(';', '&').replaceAll(':', '='));
  const move = Number(args.get('step'));
  const index = branches[role].steps.findLastIndex(item => item.ход < move);
  if (index < 0 || index === step) return;
  step = index;
  refreshStepControls();
  запомнить();
}

window.addEventListener('message', event => {
  if (event.source !== окно.contentWindow || event.origin !== location.origin) return;
  if (event.data?.type === 'meeting-people-applied') {
    if (event.data.request !== peopleUpdateId) return;
    clearTimeout(peopleUpdateTimer);
    if (!event.data.applied) openStep(step);
    return;
  }
  if (event.data?.type === 'meeting-countdown-state') {
    if (подготовка || ошибкаПерехода || !окно.contentDocument?.documentElement.dataset.prototypeReady) return;
    timerAvailable = event.data.enabled === true;
    updateTimerButton();
    return;
  }
  if (event.data?.type !== 'prototype-frame-ready') return;
  if (peopleOnReady) changePeople(peopleOptions.indexOf(people));
  sendAgenda(openAgendaOnReady);
  sendCamera();
  sendBackground();
  окно.contentWindow.postMessage({type:'meeting-countdown-status'}, location.origin);
  syncStep();
});
нарисовать();
вписать();
openStep(step);
window.setInterval(syncStep, 300);
