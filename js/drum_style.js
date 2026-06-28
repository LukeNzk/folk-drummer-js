class DrumPattern
{
    weight = 0.0
    beat = []
    gain = []
};

function _normalizeWeights(patterns)
{
    let sum = 0.0;
    for (let i = 0; i < patterns.length; ++i)
    {
        sum += patterns[i].weight;
    }

    let threshold = 0.0
    for (let i = 0; i < patterns.length; ++i)
    {
        threshold += patterns[i].weight / sum;
        patterns[i].weight = threshold;
    }

    patterns[patterns.length - 1].weight = 1.0;
}

function styleMazurek()
{
    const patterns = [];
    
    {
        const pat = new DrumPattern();
        pat.weight = 40.0;
        pat.beat = [0, 2, 2, 0, 2, 2];
        pat.gain = [1.0, 0.8, 0.8, 0.8, 0.8, 0.8]
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 1, 1, 1, 1, 1];
        pat.gain = [1.0, 0.8, 0.8, 0.8, 1.0, 0.8]
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 0, 0, 0, 2, 2];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 2, 2, 0, 0, 0];
        pat.gain = [1.0, 0.8, 0.8, 1.0, 0.8, 0.8];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 1, 0, 1, 0, 1, 0, 2, 2, 0, 2, 2];
        pat.gain = [1.0, 0.8, 0.6, 1.0, 0.8, 0.8];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, -1, 0, -1, 0, 0, 0, 2, 2, 0, 2, 2];
        patterns.push(pat);
    }

    _normalizeWeights(patterns);
    return patterns;
}

function styleOwijok()
{
    const patterns = [];
    
    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 1, 1, 0, 1, 0];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 0.5;
        pat.beat = [0, 0, 0, 0, 1, 0];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 0.3;
        pat.beat = [0, 1, 0, 1, 1, -1];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 1, 1, 0, 1, 1];
        patterns.push(pat);
    }

        {
        const pat = new DrumPattern();
        pat.weight = 1.0;
        pat.beat = [0, 1, 0, 0, 1, 0];
        patterns.push(pat);
    }

    _normalizeWeights(patterns);
    return patterns;
}

function stylePolka()
{
    const patterns = [];
    
    {
        const pat = new DrumPattern();
        pat.weight = 2.0;
        pat.beat = [0, 1];
        patterns.push(pat);
    }

    {
        const pat = new DrumPattern();
        pat.weight = 0.8;
        pat.beat = [0, 1, 1, 1];
        patterns.push(pat);
    }

    _normalizeWeights(patterns);
    return patterns;
}

class BeatInfo
{
    beat = 0;
    shift = 0;
    volume = 1.0;
};

export class StyleProcessor
{
    mazurekStyle = styleMazurek();
    polkaStyle = stylePolka();
    metrum = 3;
    
    currentPattern = [];

    reset = (metrum) => { 
        this.metrum = metrum;
        this.rollPattern();
    }

    step = (beatNum) =>
    {
        const beatInPattern = beatNum % this.currentPattern.beat.length;

        const res = new BeatInfo();
        res.beat = this.currentPattern.beat[beatInPattern];
        res.gain = this.currentPattern.gain[beatInPattern];

        if (!res.gain)
        {
            res.gain = 1.0;
        }

        if ((beatInPattern + 1) == this.currentPattern.beat.length)
        {
            this.rollPattern();
        }

        return res;
    };

    rollPattern = () => {
        const r = Math.random();
        let style;
        if (this.metrum == 3)
        {
            style = this.mazurekStyle;
        }
        else if (this.metrum == 2)
        {
            style = this.polkaStyle;
        }

        for (let i = 0; i < style.length; ++i)
        {
            const pattern = style[i];
            this.currentPattern = pattern;

            if (r <= pattern.weight)
            {
                break;
            }
        }
    };
};

export const styleProcesor = new StyleProcessor();
styleProcesor.reset(3);
