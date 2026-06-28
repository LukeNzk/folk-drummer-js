import { styleProcesor } from './drum_style.js';
import { getClipForBeat } from './resource_manager.js';
import EventType from './events.js';
import { playClip } from './audio_engine.js';

class PlaySettings
{
    metrum = 3;
    bpm = 0;
    shift = 0;
    drumType = "";
};

class PlayingData
{
    drum = null;
    beatNum = 0;
    grid = [];

    nextBeatTime = 0.0;

    //** @type PlaySettings */
    info = new PlaySettings();

    reset = () =>
    {
        this.beatNum = 0;
        this.nextBeatTime = 0.0;
    }
};

let _playing = new PlayingData();

class GridSettings
{
    metrum = 3;
    bpm = 0;
    beatShift = 0;
};

export function drumTick(ctx)
{
    if (_playing.nextBeatTime < ctx.timeNow)
    {
        const timeDrift = ctx.timeNow - _playing.nextBeatTime;
        const beatIdx = _playing.beatNum % _playing.grid.length;
        const timeToNext = _playing.grid[beatIdx] * 1000.0 - Math.min(timeDrift, 10.0);

        _playing.nextBeatTime = ctx.timeNow + timeToNext;
        
        // const metrum = _playing.info.metrum;
        // const measure = Math.floor(_playing.beatNum / metrum);

        const beatStyle = styleProcesor.step(_playing.beatNum);

        if (beatStyle.beat != -1)
        {
            const clip = getClipForBeat(_playing.info.drumType, beatStyle.beat);
            if (clip)
            {
                playClip(clip, beatStyle.gain);
            }
        }

        window.dispatchEvent(new CustomEvent(EventType.player_beat, { detail: { beatNum: _playing.beatNum, beatId: beatIdx }}))

        _playing.beatNum++;
    }
}

export function drumReset()
{
    _playing.reset();
}

function _updateMusicGrid(metrum, bpm, shift)
{
    const noteLength = 60.0 / bpm;
    const shiftOffset = noteLength * shift;

    const res = [];

    if (metrum == 3)
    {
        res.push(noteLength);
        res.push(noteLength - shiftOffset);
        res.push(noteLength + shiftOffset);
    }
    else if (metrum == 2)
    {
        res.push(noteLength);
        res.push(noteLength);
    }
    else
    {
        console.error("Invalid metrum");
    }

    return res;
}

function handleUpdateBpm(e)
{
    _playing.info.bpm = e.detail.bpm;
    _playing.grid = _updateMusicGrid(_playing.info.metrum, _playing.info.bpm, _playing.info.shift);
}

function handleUpdateShift(e)
{
    _playing.info.shift = e.detail.shift;
    _playing.grid = _updateMusicGrid(_playing.info.metrum, _playing.info.bpm, _playing.info.shift);
}

function handleUpdateMetrum(e)
{
    _playing.info.metrum = e.detail.metrum;
    styleProcesor.reset(_playing.info.metrum);
    _playing.grid = _updateMusicGrid(_playing.info.metrum, _playing.info.bpm, _playing.info.shift);
}

function handleDrumChange(e)
{
    _playing.info.drumType = e.detail.drum;
}

window.addEventListener(EventType.update_bpm, handleUpdateBpm);
window.addEventListener(EventType.update_shift, handleUpdateShift);
window.addEventListener(EventType.update_metrum, handleUpdateMetrum);
window.addEventListener(EventType.update_drum, handleDrumChange);