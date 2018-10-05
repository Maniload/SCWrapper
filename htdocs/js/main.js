let playlists;
let currentTracks;
let playbackContext;

$(document).ready(function () {

    $.get("https://api.soundcloud.com/users/199802814/playlists?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb", function (data) {

        playlists = data;

        let select = $("#playlist-select");
        let index = 0;
        for (let playlist of data) {
            select.append($("<option>", {
                html: playlist.title,
                value: index++
            }));
        }

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

        $("#audio").on("ended", function () {

            console.log(playbackContext);
            if (playbackContext !== undefined && playbackContext.tracks.length > playbackContext.index + 1) {
                playbackContext.index++;
                let track = playbackContext.tracks[playbackContext.index];
                $("#audio").attr("src", track.stream_url + "?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb");
                onTrackChange(track);
            }

        });

        allSelect.click();

    });

});

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
    let index = 0;
    let previousId = -1;
    for (let track of tracks) {
        // Eliminate duplicates
        if (previousId === track.id) {
            index++;
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

        coverBox.append($("<img>", {
            src: getArtworkUrl(track),
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

        trackElement.append(coverBox, infoBox, durationBox);
        content.append(trackElement, $("<hr>"));

        trackElement.click(function () {

            playbackContext = {
                tracks: currentTracks,
                index: $(this).attr("track-index")
            };
            console.log(currentTracks);
            let track = currentTracks[playbackContext.index];
            $("#audio").attr("src", track.stream_url + "?client_id=LvWovRaJZlWCHql0bISuum8Bd2KX79mb");
            onTrackChange(track);
            return false;

        });
    }
    currentTracks = tracks;
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
    }
}