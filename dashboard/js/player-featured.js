window.addEventListener('DOMContentLoaded', (event) => {
    const playerFeaturedReplicant = nodecg.Replicant("player-featured-settings");
    const RTMPFeaturedPlayerReplicant = nodecg.Replicant("rtmp-data-featured-player");
    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");

    const playerSelectionWrapper = document.getElementById("player-selection-wrapper");
    const sourceSelectionWrapper = document.getElementById(`media-source-selection-wrapper-featured`);

    const RTMPRegion = document.getElementById("rtmp-region");
    const RTMPKey = document.getElementById("rtmp-key");
    const currentPB = document.getElementById("current-pb");
    const AFK = document.getElementById("afk");
    const openSlot = document.getElementById("open-slot");

    AFK.onclick = function() {onCheckboxClick("afk", AFK.checked)};
    openSlot.onclick = function() {onCheckboxClick("open-slot", openSlot.checked)};

    let connected = false;

    const server = 'server';
    const web = 'web';

    initializeValues();
    function initializeValues() {
        nodecg.listenFor(`${web}-media-sources`, (data) => {
            sourceSelectionWrapper.innerHTML = "";
            sourceSelectionWrapper.append(createMediaSourceSelection("media-source-selection-featured", mediaSourcesReplicant.value.mediaSources));
            document.getElementById(`media-source-selection-featured`).value = playerFeaturedReplicant.value.sourceName;
            updateReplicant();
        });

        nodecg.listenFor(`${web}-obs-status`, (status) => {
            if (status.connected) {
                const sourceSelection = document.getElementById(`media-source-selection-featured`);

                sourceSelection.disabled = false;
                RTMPRegion.disabled = false;
                RTMPKey.disabled = false;
            } else {
                const sourceSelection = document.getElementById(`media-source-selection-featured`);

                sourceSelection.disabled = true;
                RTMPRegion.disabled = true;
                RTMPKey.disabled = true;
            }
        });

        nodecg.listenFor(`${web}-swap-video-source`, (data) => {
            if (data !== undefined) {
                if (data.source1.id === "featured") {
                    updateValues(data.source2.playerData);
                }
                if (data.source2.id === "featured") {
                    updateValues(data.source1.playerData);
                }
            }
        });

        nodecg.listenFor(`${server}-media-sources`, (data) => {
            sourceSelectionWrapper.innerHTML = "";
            sourceSelectionWrapper.append(createMediaSourceSelection("media-source-selection-featured", data.mediaSources));
        });

        NodeCG.waitForReplicants(playerFeaturedReplicant, runDataReplicant, RTMPFeaturedPlayerReplicant, mediaSourcesReplicant).then(() => {
            playerSelectionWrapper.append(createPlayerSelection("featured", runDataReplicant.value.teams));
            document.getElementById("player-selection-featured").value = playerFeaturedReplicant.value.playerSelected;

            sourceSelectionWrapper.innerHTML = "";
            sourceSelectionWrapper.append(createMediaSourceSelection("media-source-selection-featured", mediaSourcesReplicant.value.mediaSources));
            document.getElementById(`media-source-selection-featured`).value = playerFeaturedReplicant.value.sourceName;

            if (playerFeaturedReplicant.value.rtmp.region !== undefined) {
                RTMPRegion.value = playerFeaturedReplicant.value.rtmp.region;
            }

            if (playerFeaturedReplicant.value.rtmp.key !== undefined) {
                RTMPKey.value = playerFeaturedReplicant.value.rtmp.key;
            }

            if (playerFeaturedReplicant.value.currentPB !== undefined) {
                currentPB.value = playerFeaturedReplicant.value.currentPB;
            }

            AFK.checked = playerFeaturedReplicant.value.afk;
            openSlot.checked = playerFeaturedReplicant.value.openSlot;

            runDataReplicant.on("change", (newValue) => {
                if (newValue) {
                    playerSelectionWrapper.innerHTML = "";
                    playerSelectionWrapper.append(createPlayerSelection("featured", newValue.teams));
                }
            });
        });
    }

    function updateValues(values) {
        document.getElementById("player-selection-featured").value = values.playerSelected;
        document.getElementById(`media-source-selection-featured`).value = values.sourceName;
        RTMPRegion.value = values.rtmp.region;
        RTMPKey.value = values.rtmp.key;
        currentPB.value = values.currentPB;
        AFK.checked = values.afk;
        openSlot.checked = values.openSlot;
        updateReplicant();
    }

    document.getElementById("featured-player-submit").onclick = function (e) {
        updateReplicant();

        e.preventDefault();
    }

    function updateReplicant() {
        const playerSelection = document.getElementById("player-selection-featured");
        const sourceSelection = document.getElementById(`media-source-selection-featured`);

        playerFeaturedReplicant.value = {"id": "featured", "playerSelected": playerSelection.value, "rtmp": {"region": RTMPRegion.value, "key": RTMPKey.value},
            "sourceName": sourceSelection.value, "currentPB": currentPB.value, "afk": AFK.checked, "openSlot": openSlot.checked};

        RTMPFeaturedPlayerReplicant.value = {"id": "featured", "rtmp": {"region": RTMPRegion.value, "key": RTMPKey.value},
            "sourceName": sourceSelection.value};
    }

    function onCheckboxClick(id, checked) {
        if (checked) {
            switch (id) {
                case "open-slot": AFK.checked = false;
                    openSlot.checked = true;
                    break;
                case "afk": openSlot.checked = false;
                    AFK.checked = true;
                    break;
            }
        }
        else {
            document.getElementById(id).checked = false;
        }
    }

    function createMediaSourceSelection(id, data) {
        const label = document.createElement("label");
        label.setAttribute("for", id)
        label.innerHTML = "OBS Media Source"
        const select = document.createElement("select");
        select.setAttribute("class", "small-player-select");
        select.setAttribute("id", id);
        select.setAttribute("name", id)
        let i = 0;
        for (let dataID in data) {
            const option = document.createElement("option");
            const sourceName = data[dataID].sourceName;
            option.value = sourceName;
            option.innerHTML = sourceName;
            if (playerFeaturedReplicant.value.sourceName === sourceName || id === "featured") {
                option.selected = true;
            }
            i++
            select.append(option);
        }
        if (i === 0) {
            select.disabled = true;
        }
        label.append(select);
        return label;
    }

    function createPlayerSelection(id, teamsInSpeedcontrol) {
        const select = document.createElement("select");
        select.setAttribute("class", "small-player-select");
        select.setAttribute("id", `player-selection-${id}`);
        for (let i = 0; i < teamsInSpeedcontrol.length; i++) {
            const option = document.createElement("option");
            const player = teamsInSpeedcontrol[i].players[0];
            option.value = player.name;
            option.innerHTML = player.name;
            if (id === 0) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        return select;
    }
});