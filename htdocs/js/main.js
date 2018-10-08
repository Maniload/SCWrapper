let playlists = [];
let currentTracks;
let playbackContext;

$(document).ready(function () {

    $.get("https://api.soundcloud.com/users/199802814/playlists?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb", function (data) {

        let select = $("#playlist-select");
        let count = data.length;
        let index = 0;

        for (let playlist of data) {
            $.get(playlist.uri + "?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb", function (data) {

                select.append($("<option>", {
                    html: data.title,
                    value: index++
                }));

                let trackIndex = 0;
                for (let track of data.tracks) {
                    track.trackIndex = trackIndex++;
                }

                playlists.push(data);

                if (index === count) {
                    setup();
                }

            });
        }

    });

});

function setup() {
    let select = $("#playlist-select");

    select.change(function () {
        display(playlists[this.value].tracks);
    });

    $("#search").on("input", function () {

        displayAll($("#search").val());

    });

    let allSelect = $("#show-all");

    allSelect.click(function () {

        $("#playlist-select").prop("disabled", true);
        $("#search").prop("disabled", true);

        displayAll();

    });

    $("#show-playlist").click(function () {

        $("#search").prop("disabled", true);

        let playlistSelect = $("#playlist-select");
        playlistSelect.prop("disabled", false);
        display(playlists[playlistSelect.val()].tracks);

    });

    $("#show-search").click(function () {

        $("#playlist-select").prop("disabled", true);

        let search = $("#search");
        search.prop("disabled", false);
        displayAll(search.val());

    });

    $("#order-select").change(function () {

        display(currentTracks);

    });

    let audio = $("#audio");
    audio.on("ended", function () {

        console.log(playbackContext);
        if (playbackContext !== undefined && playbackContext.tracks.length > playbackContext.index + 1) {
            playbackContext.index++;
            let track = playbackContext.tracks[playbackContext.index];
            $("#audio").attr("src", track.stream_url + "?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb");
            onTrackChange(track);
        }

    });

    audio.on("timeupdate", function () {

        let audioNow = audio.get(0);
        $(".now-playing-progress").eq(0).css("width", (audioNow.currentTime / audioNow.duration * 100) + "%");

    });

    audio.on("play", function () {

        $("#play-button i").eq(0).html("pause_button");

    });

    audio.on("pause", function () {

        $("#play-button i").eq(0).html("play_arrow");

    });

    $("#play-button").click(function () {

        let audioNow = audio.get(0);
        if (audioNow.paused) {
            audioNow.play();
        } else {
            audioNow.pause();
        }
        return false;

    });

    allSelect.click();
}

function displayAll(query = undefined) {
    let tracks = [];
    for (let playlist of playlists) {
        for (let track of playlist.tracks) {
            if (query === undefined || track.title.toLowerCase().indexOf(query.toLowerCase()) >= 0 || track.user.username.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                tracks.push(track);
            }
        }
    }
    display(tracks);
}

function display(tracks) {
    tracks.sort(getSortingFunction());
    let content = $("#content");
    content.empty();
    currentTracks = [];
    let index = 0;
    let previousId = -1;
    for (let track of tracks) {
        // Eliminate duplicates
        if (previousId === track.id) {
            continue;
        }

        previousId = track.id;

        let trackElement = $("<a>", {
            href: "#",
            "track-index": index++,
            "class": "track-item"
        });
        let coverBox = $("<div>", {
            "class": "cover-box left"
        });
        let infoBox = $("<div>", {
            "class": "info-box left"
        });
        let durationBox = $("<div>", {
            "class": "duration-box right clear-after"
        });

        let artworkUrl = getArtworkUrl(track);
        coverBox.append($("<img>", {
            src: artworkUrl,
            "class": "cover"
        }));
        let overlay = $("<div>", {
            "class": "cover-overlay"
        });
        overlay.append($("<i>", {
            html: "play_arrow",
            "class": "icon material-icons"
        }));
        coverBox.append(overlay);

        infoBox.append($("<h3>", {
            html: track.title,
            "class": "one-line"
        }), $("<h4>", {
            html: track.user.username,
            "class": "one-line"
        }));
        durationBox.append($("<span>", {
            html: new Date(track.duration).toISOString().substr(14, 5)
        }));

        trackElement.append($("<img>", {
            src: artworkUrl,
            "class": "background-cover"
        }), coverBox, infoBox, durationBox);
        content.append(trackElement);

        trackElement.click(function () {

            playbackContext = {
                tracks: currentTracks,
                index: $(this).attr("track-index")
            };
            let track = currentTracks[playbackContext.index];
            $("#audio").attr("src", track.stream_url + "?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb");
            onTrackChange(track);
            return false;

        });

        currentTracks.push(track);
    }
}

function onTrackChange(track) {
    $("#now-playing-title").html(track.title);
    $("#now-playing-artist").html(track.user.username);
    $("#now-playing-cover").attr("src", getArtworkUrl(track));
}

function getArtworkUrl(track) {
    let imageUrl = track.artwork_url || track.user.avatar_url;
    if (!imageUrl.includes("default_avatar")) {
        imageUrl = imageUrl.replace("large", "t500x500");
    }
    return imageUrl;
}

function getSortingFunction(name = $("#order-select").val()) {
    if (name.endsWith("-reverse")) {
        let sortingFunction = getSortingFunction(name.replace("-reverse", ""));
        return function (a, b) {
            return sortingFunction(b, a);
        }
    }
    switch (name) {
        case "alpha":
            return function (a, b) {
                return a.title.localeCompare(b.title);
            };
        case "release":
            return function (a, b) {
                return a.created_at.localeCompare(b.created_at);
            };
        case "playlist":
            return function (a, b) {
                return a.trackIndex - b.trackIndex;
            };
        case "duration":
            return function (a, b) {
                return a.duration - b.duration;
            };
    }
}