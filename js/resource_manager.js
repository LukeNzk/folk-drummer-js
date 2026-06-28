import EventType from "./events.js";

let drumDefinitions = null;

let assets = {
    ready : false
}

let _audioCtx = null;
const _buffersCache = new Map(); // key: normalized URL, value: Promise<AudioBuffer>
const drumClips = new Map();

function normalizeAssetPath(p) {
  const withSlashes = String(p).replace(/\\/g, '/');
  return withSlashes.startsWith('/') ? withSlashes : `/${withSlashes}`;
}

async function loadBuffer(urlPath) {
  const url = normalizeAssetPath(urlPath);
  if (_buffersCache.has(url)) return _buffersCache.get(url);

  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
    const arrayBuf = await resp.arrayBuffer();
    // Decode to AudioBuffer
    return await _audioCtx.decodeAudioData(arrayBuf);
  })();

  _buffersCache.set(url, promise);
  return promise;
}

async function loadDrum(name) {
  const entry = drumDefinitions[name];
  if (!entry) {
    throw new Error(`Drum "${name}" not found or has no sounds[]`);
  }

  let sounds = [];
  for (const key in entry.sounds)
  {
    sounds.push(entry.sounds[key]);
  }

  const soundLoaders = await Promise.all(
    sounds.map(async (sound) => {
      const { type, variants } = sound;
      if (!Array.isArray(variants)) {
        throw new Error(`Invalid sound entry for drum "${name}"`);
      }
      const variantObjs = await Promise.all(
        variants.map(async (v) => {
          const url = normalizeAssetPath(v);
          const buffer = await loadBuffer(url);
          return { url, buffer };
        })
      );

      return { type, variants: variantObjs };
    })
  );

  return { name, sounds : soundLoaders };
}

// function playClip(buffer, gain, opts = {}) {
//   const { playbackRate = 1.0, destination = _audioCtx.destination } = opts;

//   // Some browsers require user gesture before starting audio
//   if (_audioCtx.state === 'suspended') {
//     // You can call this in a click handler the first time
//     _audioCtx.resume().catch(() => {});
//   }

//   const source = _audioCtx.createBufferSource();
//   source.buffer = buffer;
//   source.playbackRate.value = playbackRate;

//   const gainNode = _audioCtx.createGain();
//   gainNode.gain.value = gain;

//   source.connect(gainNode).connect(destination);
//   source.start();

//   return {
//     stop: () => {
//       try { source.stop(); } catch {}
//     },
//     source,
//     gainNode
//   };
// }

async function initResources()
{
    const r = await fetch('assets.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();

    drumDefinitions = json;
    assets.ready = true;

    loadDrum('frame').then(
        (drumResult) => {
            drumClips.set('frame', drumResult);

            const loadingEndEvt = new CustomEvent(EventType.load_end, { detail: 'frame'});
            window.dispatchEvent(loadingEndEvt);
        }
    );
}

window.addEventListener(EventType.app_start, () => {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const loadingStartEvt = new CustomEvent(EventType.load_start);
    window.dispatchEvent(loadingStartEvt);

    initResources();
});

function onLoadDrumRequest(e)
{
  const drumToLoad = e.detail.drum;
  if (drumClips.has(drumToLoad))
  {
    console.log(drumToLoad + ' drum already loaded');
  }
  else
  {
    const loadingStartEvt = new CustomEvent(EventType.load_start);
    window.dispatchEvent(loadingStartEvt);

    console.log('Loading drum ' + drumToLoad);
    loadDrum(drumToLoad).then(
    (drumResult) => {
        drumClips.set(drumToLoad, drumResult);

        const loadingEndEvt = new CustomEvent(EventType.load_end, { detail: drumToLoad});
        window.dispatchEvent(loadingEndEvt);
    });
  }
}

window.addEventListener(EventType.load_drum, onLoadDrumRequest);

export function getClipForBeat(drumType, beat)
{
    const drum = drumClips.get(drumType);

    if (drum == undefined)
    {
      console.log('Drum not loaded ' + drumType);
      return;
    }

    let sound = drum.sounds.find(s => s.type === beat);

    if (sound == undefined)
    {
      sound = drum.sounds[1];
    }

    const variantIdx = Math.floor(Math.random() * sound.variants.length);
    const variant = sound.variants[variantIdx];
    return variant.buffer;
}
