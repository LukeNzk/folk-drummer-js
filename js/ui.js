import EventType from "./events.js";

let isPlaying = false;

class DrumSettings
{
    metrum = 3;
    drumType = 0;
    shift = -15;
    bpm = 185;
}

function loadSettings()
{
    const params = new URLSearchParams(window.location.search);
    let settings = new DrumSettings();

    const settingParam = params.get('s');
    if (settingParam && settingParam.length > 0)
    {
        console.log("Loading URL encoded settings");
        settings.metrum = settingParam[0];
        settings.drum = settingParam[1];

        settings.bpm = parseInt(settingParam[2]) * 100;
        settings.bpm += parseInt(settingParam[3]) * 10;
        settings.bpm += parseInt(settingParam[4]);

        settings.shift = parseInt(settingParam[5] + "1");
        settings.shift = parseInt(settingParam[6]) * 10;
        settings.shift += parseInt(settingParam[7]);

        console.log(settings);
    }

    return settings;
}

function drumTypeToName(type)
{
    switch (type)
    {
        case 0:
            return 'frame';
            break;
        case 1:
            return 'baraban';
            break;
    }

    return 'invalid';
}

let drum = loadSettings();

const minBpm = 60;
const maxBpm = 300;
const minShift = -50;
const maxShift = 50;

const drumButton = document.getElementById('drum-toggle');
const metrumButton = document.getElementById('metrum-toggle');

const playButton = document.getElementById('play-button');
const stopButton = document.getElementById('stop-button');

const bpmDisplay = document.getElementById('bpm-value');
const bpmSlider = document.getElementById('bpm-slider');
const bpmFill = document.getElementById('bpm-fill');
const bpmPreview = document.getElementById('bpm-preview');

const shiftSlider = document.getElementById('shift-slider');
const shiftFill = document.getElementById('shift-fill');

const splashScreen = document.getElementById('splash');
const loadingScreen = document.getElementById('loading_screen')

function initLayout()
{
    drumButton = document.getElementById('drum-toggle');
    metrumButton = document.getElementById('metrum-toggle');

    playButton = document.getElementById('play-button');
    stopButton = document.getElementById('stop-button');

    bpmDisplay = document.getElementById('bpm-value');
    bpmSlider = document.getElementById('bpm-slider');
    bpmFill = document.getElementById('bpm-fill');
    bpmPreview = document.getElementById('bpm-preview');

    shiftSlider = document.getElementById('shift-slider');
    shiftFill = document.getElementById('shift-fill');

    splashScreen = document.getElementById('splash');
    loadingScreen = document.getElementById('loading_screen')
}

function onSplashScreenClick()
{
    splashScreen.removeEventListener('click', onSplashScreenClick);
    splashScreen.style.display = 'none';

    const appEvt = new CustomEvent(EventType.app_start);
    window.dispatchEvent(appEvt);
}

function onPlayBtnClick()
{
    isPlaying = true;
    window.dispatchEvent(new CustomEvent(EventType.start_play));
    console.log('Playing at', drum.bpm, 'BPM with', drum.shift, '% shift');

    playButton.style.display = 'none';
    stopButton.style.display = 'flex';

    playButton.removeEventListener('click', onPlayBtnClick);
    stopButton.addEventListener('click', onStopBtnClick);
}

function onStopBtnClick()
{
    isPlaying = false;
    window.dispatchEvent(new CustomEvent(EventType.stop_play));
    console.log('Stopped');

    playButton.style.display = 'flex';
    stopButton.style.display = 'none';

    stopButton.removeEventListener('click', onStopBtnClick);
    playButton.addEventListener('click', onPlayBtnClick);
}

function onLoadingStarted()
{
    loadingScreen.classList.remove('hidden');
    loadingScreen.style.display = 'flex';
}

function onLoadingFinished()
{
    loadingScreen.style.display = 'none';
}

// BPM Slider functionality
let isDraggingBPM = false;

bpmSlider.addEventListener('pointerdown', function(e) {
    isDraggingBPM = true;
    e.preventDefault();
});

function calculateSliderPos(sliderElem, mouseX)
{
    const rootContainer = sliderElem.parentElement;

    const knobRect = shiftSlider.getBoundingClientRect();
    const parentRect = rootContainer.getBoundingClientRect();

    const x = mouseX - parentRect.left - knobRect.width * 0.5;
    const maxWidth = parentRect.width - knobRect.width; // Container width minus slider width

    let newX = Math.max(0, Math.min(x, maxWidth));
    
    return { x: newX, p: newX/maxWidth }
}

function sliderPositionFromPercentage(sliderElem, p)
{
    const rootContainer = sliderElem.parentElement;

    const knobRect = sliderElem.getBoundingClientRect();
    const parentRect = rootContainer.getBoundingClientRect();

    const maxWidth = parentRect.width - knobRect.width; // Container width minus slider width
    const newX = maxWidth * p;

    return { x: newX, p: newX/maxWidth }
}

function onDrumButtonClick()
{
    if (drum.drumType == 0)
    {
        drum.drumType = 1;
    }
    else
    {
        drum.drumType = 0;
    }

    const drumName = drumTypeToName(drum.drumType);
    window.dispatchEvent(new CustomEvent(EventType.load_drum, { detail: { drum: drumName }}))

    updateDrumToggle();
}

function onMetrumButtonClick()
{
    if (drum.metrum == 3)
    {
        drum.metrum = 2;
    }
    else
    {
        drum.metrum = 3;
    }

    postMetrumEvent();
    updateMetrumToggle();
}

function togglePlay()
{
    if (isPlaying)
    {
        stopButton.click();
    }
    else
    {
        playButton.click();
    }
}

function updateBPMSlider() {
    const bpmPercent = (drum.bpm - minBpm) / (maxBpm - minBpm);

    const res = sliderPositionFromPercentage(bpmSlider, bpmPercent);
    
    const knobOffset = 100.0 * bpmSlider.getBoundingClientRect().width / bpmSlider.parentElement.getBoundingClientRect().width;
    bpmSlider.style.left = (bpmPercent * 100.0 - knobOffset * 0.5) + '%';
    bpmFill.style.width = (bpmPercent * 100.0) + '%';
    bpmDisplay.textContent = drum.bpm;
    
    postBpmEvent();
}

function updateShiftSlider()
{
    const shiftPercent = (drum.shift - minShift) / Math.abs(maxShift - minShift);
    
    const res = sliderPositionFromPercentage(shiftSlider, shiftPercent);
    
    // Update slider position
    const knobOffset = 100.0 * shiftSlider.getBoundingClientRect().width / shiftSlider.parentElement.getBoundingClientRect().width;
    shiftSlider.style.left = (shiftPercent * 100.0 - knobOffset * 0.5) + '%';
    
    // Update display (assuming there's a shift display element)
    const shiftDisplay = document.getElementById('shift-value');
    if (shiftDisplay) {
        shiftDisplay.textContent = (drum.shift > 0 ? '+' : '') + drum.shift + '%';
    }

    // Update shift fill
    const parentRect = shiftFill.parentElement.getBoundingClientRect();
    const distFromMiddle = res.x - parentRect.width * 0.5;
    let offset = 1;

    if (drum.shift <= 0)
    {
        shiftFill.classList.remove('left-[50%]');
        shiftFill.classList.add('right-[50%]');
        offset = 0;
    }
    else
    {
        shiftFill.classList.remove('right-[50%]');
        shiftFill.classList.add('left-[50%]');
    }

    shiftFill.style.width = (Math.abs(distFromMiddle) + offset) + 'px';
    shiftFill.style.width = (offset + 100.0 * Math.abs(distFromMiddle) / parentRect.width) + '%';

    postShiftEvent();
}

function updateDualStateToggle(toggleRoot, stateId)
{
    const first = toggleRoot.children[0]
    const second =  toggleRoot.children[1];

    const onClass = ['bg-app-secondary', 'z-40'];
    const offClass = ['bg-app-primary', 'z-10'];

    if (stateId == 0)
    {
        first.style.transform = 'scale(1.1)';
        first.classList.remove(...offClass);
        first.classList.add(...onClass);

        second.style.transform = 'scale(1)';
        second.classList.remove(...onClass);
        second.classList.add(...offClass);

    } else if (stateId == 1)
    {
        first.style.transform = 'scale(1)';
        first.classList.remove(...onClass);
        first.classList.add(...offClass);

        second.style.transform = 'scale(1.1)';
        second.classList.remove(...offClass);
        second.classList.add(...onClass);
    }
}

function updateDrumToggle()
{
    updateDualStateToggle(drumButton, drum.drumType);
    postDrumTypeEvent();
}

function updateMetrumToggle()
{
    const toggleState = drum.metrum == 3 ? 0 : 1;
    updateDualStateToggle(metrumButton, toggleState);

    if (drum.metrum == 2)
    {
        document.getElementById('shift-container').style.display = 'none';
    }
    else
    {
        document.getElementById('shift-container').style.display = 'block';
    }
}

function postBpmEvent()
{
    const evt = new CustomEvent(EventType.update_bpm, { detail: { bpm: drum.bpm }});
    window.dispatchEvent(evt);
}

function postShiftEvent()
{
    const evt = new CustomEvent(EventType.update_shift, { detail: { shift: drum.shift * 0.01 }});
    window.dispatchEvent(evt);
}

function postMetrumEvent()
{
    const evt = new CustomEvent(EventType.update_metrum, { detail: { metrum: drum.metrum }});
    window.dispatchEvent(evt);
}

function postDrumTypeEvent()
{
    const data = drumTypeToName(drum.drumType);
    const evt = new CustomEvent(EventType.update_drum, { detail: { drum: data }});
    window.dispatchEvent(evt);
}

function glowButtonOnBeat(beatNum, beatIdx, duration = 500) {
  const btn = stopButton.children[0];

  // Get CSS variable value at runtime
  let color = tailwind.config.theme.extend.colors['app-primary'];
  let size = 30;

  if (beatIdx == 0)
  {
    color = tailwind.config.theme.extend.colors['app-secondary'];
    size = 50;
  }

  if (glowAnim) glowAnim.cancel();

  var glowAnim = btn.animate([
    { boxShadow: '0 0 0px transparent' },
    { boxShadow: `0 0 ${size}px 0px ${color}`, offset: 0.0 },
    { boxShadow: '0 0 0px transparent' }
  ], {
    duration,
    easing: 'ease-out'
  });

  glowAnim.onfinish = () => {
    btn.style.boxShadow = '0 0 0 transparent';
    btn.style.transform = 'scale(1)';
  };
}

function onPlayerBeat(e)
{
    glowButtonOnBeat(e.detail.beatNum, e.detail.beatId);
}

function initUI()
{
    updateBPMSlider();
    postShiftEvent();
    postMetrumEvent();
    postDrumTypeEvent();

    updateDrumToggle();
    updateMetrumToggle();
    updateShiftSlider();
}

function appInit()
{
    window.addEventListener(EventType.load_start, onLoadingStarted);
    window.addEventListener(EventType.load_end, onLoadingFinished);
    window.addEventListener(EventType.player_beat, onPlayerBeat);

    splashScreen.addEventListener('click', onSplashScreenClick);
    playButton.addEventListener('click', onPlayBtnClick);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowUp':
                e.preventDefault();
                drum.bpm = Math.min(maxBpm, drum.bpm + 5);
                updateBPMSlider();
                break;
            case 'ArrowDown':
                e.preventDefault();
                drum.bpm = Math.max(minBpm, drum.bpm - 5);
                updateBPMSlider();
                break;
            case 'ArrowRight':
                drum.shift = Math.min(maxShift, drum.shift + 1)
                updateShiftSlider();
                break;
            case 'ArrowLeft':
                drum.shift = Math.max(minShift, drum.shift - 1)
                updateShiftSlider();
                break;
        }
    });

    drumButton.addEventListener('click', onDrumButtonClick);
    metrumButton.addEventListener('click', onMetrumButtonClick);

    document.addEventListener('pointermove', function(e) {
        if (!isDraggingBPM) return;
        
        const sliderRes = calculateSliderPos(bpmSlider,  e.clientX);
        drum.bpm = Math.round(minBpm + (sliderRes.p * (maxBpm - minBpm)));
        updateBPMSlider();
    });

    document.addEventListener('pointerup', function() {
        isDraggingBPM = false;
        isDraggingShift = false;
    });

    document.addEventListener('pointercancel', function() {
        isDraggingBPM = false;
        isDraggingShift = false;
    });

    // Shift Slider functionality
    let isDraggingShift = false;

    shiftSlider.addEventListener('pointerdown', function(e) {
        isDraggingShift = true;
        e.preventDefault();
    });

    document.addEventListener('pointermove', function(e) {
        if (!isDraggingShift) return;
        
        const res = calculateSliderPos(shiftSlider, e.clientX);
        
        drum.shift = Math.round(minShift + (res.p * Math.abs(minShift - maxShift)));
        
        updateShiftSlider();
    });

    initUI();
}

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn, { once: true });
}

onReady(appInit);
