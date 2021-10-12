window.addEventListener('DOMContentLoaded', (event) => {
    const playerFeaturedReplicant = nodecg.Replicant("player-featured-settings", {defaultValue: {}});
    const RTMPFeaturedPlayerReplicant = nodecg.Replicant("rtmp-data-featured-player");
    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");

    const playerSelection = document.getElementById("player-selection-featured");
    const sourceSelection = document.getElementById(`media-source-selection-featured`);

    const RTMPRegion = document.getElementById("rtmp-region");
    const RTMPKey = document.getElementById("rtmp-key");
    const currentPB = document.getElementById("current-pb");
    const AFK = document.getElementById("afk");
    const openSlot = document.getElementById("open-slot");

    AFK.onclick = function () {
        onCheckboxClick("afk", AFK.checked)
    };
    openSlot.onclick = function () {
        onCheckboxClick("open-slot", openSlot.checked)
    };

    const server = 'server';
    const web = 'web';

    initializeValues();

    function initializeValues() {
        nodecg.listenFor(`${web}-media-sources`, (data) => {
            sourceSelection.innerHTML = "";
            const options = createMediaSourceSelection(data.mediaSources);
            for (let i = 0; i < options.length; i++) {
                sourceSelection.append(options[i]);
            }
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

        nodecg.listenFor(`${web}-rtmp-change-result`, (data) => {
            if (data.id === "featured") {
                RTMPFeaturedPlayerReplicant.value = data;
            }
        });

        nodecg.listenFor(`${web}-swap-video-source-result`, (data) => {
            if (data !== undefined) {
                if (data.source1.id === "featured") {
                    updateValues(data.source2.playerData);
                }
                if (data.source2.id === "featured") {
                    updateValues(data.source1.playerData);
                }
            }
        });

        NodeCG.waitForReplicants(playerFeaturedReplicant, runDataReplicant, RTMPFeaturedPlayerReplicant, mediaSourcesReplicant).then(() => {
            if (playerFeaturedReplicant.value !== undefined) {
                if (runDataReplicant.value !== undefined) {
                    const options = createPlayerSelection(runDataReplicant.value.teams);
                    for (let i = 0; i < options.length; i++) {
                        playerSelection.append(options[i]);
                    }
                }
                if (mediaSourcesReplicant.value !== undefined) {
                    const options = createMediaSourceSelection(mediaSourcesReplicant.value.mediaSources);
                    for (let i = 0; i < options.length; i++) {
                        sourceSelection.append(options[i]);
                    }
                }

                if (RTMPFeaturedPlayerReplicant.value !== undefined) {
                    if (RTMPFeaturedPlayerReplicant.value.rtmp.region !== undefined) {
                        RTMPRegion.value = RTMPFeaturedPlayerReplicant.value.rtmp.region;
                    }

                    if (RTMPFeaturedPlayerReplicant.value.rtmp.key !== undefined) {
                        RTMPKey.value = RTMPFeaturedPlayerReplicant.value.rtmp.key;
                    }
                }

                if (playerFeaturedReplicant.value.currentPB !== undefined) {
                    currentPB.value = playerFeaturedReplicant.value.currentPB;
                }

                AFK.checked = playerFeaturedReplicant.value.afk;
                openSlot.checked = playerFeaturedReplicant.value.openSlot;
            }

            runDataReplicant.on("change", (newValue) => {
                if (newValue) {
                    playerSelection.innerHTML = "";
                    const options = createPlayerSelection(newValue.teams);
                    for (let i = 0; i < options.length; i++) {
                        playerSelection.append(options[i]);
                    }
                }
                updateReplicant();
            });
        });
    }

    function checkRTMPForChange(data) {
        const featuredPlayer = RTMPFeaturedPlayerReplicant.value;
        if (featuredPlayer !== undefined && featuredPlayer.rtmp !== undefined) {
            if (data.rtmp.region === featuredPlayer.rtmp.region && data.rtmp.key === featuredPlayer.rtmp.key && data.sourceName === featuredPlayer.sourceName) {
                return false;
            } else {
                return true;
            }
        }
        else {
            return true;
        }
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

        playerFeaturedReplicant.value = {
            "id": "featured",
            "playerSelected": playerSelection.value,
            "rtmp": {"region": RTMPRegion.value, "key": RTMPKey.value},
            "sourceName": sourceSelection.value,
            "currentPB": currentPB.value,
            "afk": AFK.checked,
            "openSlot": openSlot.checked
        };

        const rtmp = {
            "id": "featured", "rtmp": {"region": "" + RTMPRegion.value, "key": "" + RTMPKey.value},
            "sourceName": "" + sourceSelection.value
        };

        if (checkRTMPForChange(rtmp)) {
            nodecg.sendMessage(`${server}-rtmp-change`, rtmp);
        }
    }

    function onCheckboxClick(id, checked) {
        if (checked) {
            switch (id) {
                case "open-slot":
                    AFK.checked = false;
                    openSlot.checked = true;
                    break;
                case "afk":
                    openSlot.checked = false;
                    AFK.checked = true;
                    break;
            }
        } else {
            document.getElementById(id).checked = false;
        }
    }

    function createMediaSourceSelection(data) {
        const options = [];
        let i = 0;
        for (let dataID in data) {
            const option = document.createElement("option");
            const sourceName = data[dataID].sourceName;
            option.value = sourceName;
            option.innerHTML = sourceName;
            if (playerFeaturedReplicant.value.sourceName === sourceName) {
                option.selected = true;
            }
            i++
            options.push(option);
        }
        return options;
    }

    function createPlayerSelection(teamsInSpeedcontrol) {
        const options = [];
        for (let i = 0; i < teamsInSpeedcontrol.length; i++) {
            const option = document.createElement("option");
            const playerName = teamsInSpeedcontrol[i].players[0].name;
            option.value = playerName;
            option.innerHTML = playerName;
            if (playerFeaturedReplicant.value !== undefined && playerName === playerFeaturedReplicant.value.playerSelected) {
                option.selected = true;
            }
            options.push(option);
        }
        return options;
    }
});