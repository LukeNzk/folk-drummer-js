const EventType = {
    app_start: "appstart",
    drum_loaded: "drumload",
    load_drum: "reqdrum",

    load_start: "ldg_s",
    load_end: "ldg_e",

    // player
    update_metrum: "player_metrum",
    update_shift: "player_shift",
    update_bpm: "player_bpm",
    update_drum: "player_drum_type",

    start_play: "player_start",
    stop_play: "player_stop",

    // beat
    player_beat: "beat"
};

export default EventType;
