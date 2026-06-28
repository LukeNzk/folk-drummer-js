import EventType from "./events.js";

let AudioEngine =
{
    /** @type AudioContext */
    ctx: null,
};

async function initializeAudio()
{
    AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
}

window.addEventListener(EventType.app_start, async () => {
    await initializeAudio();
});

export function playClip(buffer, gain, opts = {}) {
  const { playbackRate = 1.0, destination = AudioEngine.ctx.destination } = opts;

  // Some browsers require user gesture before starting audio
  if (AudioEngine.ctx.state === 'suspended') {
    // You can call this in a click handler the first time
    AudioEngine.ctx.resume().catch(() => {});
  }

  const source = AudioEngine.ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  const gainNode = AudioEngine.ctx.createGain();
  gainNode.gain.value = gain;

  source.connect(gainNode).connect(destination);
  source.start();

  return {
    stop: () => {
      try { source.stop(); } catch {}
    },
    source,
    gainNode
  };
}
