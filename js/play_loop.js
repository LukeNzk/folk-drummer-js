import { drumReset, drumTick } from './drum_player.js';
import EventType from './events.js';

class LoopContext
{
    currTime = 0.0;
    play = false;
};

const _loopCtx = new LoopContext();

function _playbackLoop()
{
    const nowTime = performance.now();

    const dt = nowTime - _loopCtx.currTime;
    _loopCtx.currTime = nowTime;

    const tickCtx = {
        dt: dt,
        timeNow: nowTime
    }

    drumTick(tickCtx);

    if (_loopCtx.play)
        requestAnimationFrame(_playbackLoop);
}

function _startPlaybackLoop()
{
    window.removeEventListener(EventType.start_play, _startPlaybackLoop);
    window.addEventListener(EventType.stop_play, _stopPlaybackLoop);
    
    _loopCtx.play = true;
    _loopCtx.currTime = performance.now();
    _loopCtx.nextTick = _loopCtx.currTime + _loopCtx.interval;

    drumReset();
    requestAnimationFrame(_playbackLoop);
}

function _stopPlaybackLoop()
{
    _loopCtx.play = false;
    window.addEventListener(EventType.start_play, _startPlaybackLoop);
}

window.addEventListener(EventType.start_play, _startPlaybackLoop);
