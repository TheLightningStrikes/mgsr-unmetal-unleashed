window.addEventListener('DOMContentLoaded', (event) => {
    const playerFeaturedReplicant = nodecg.Replicant("player-featured-settings", {defaultValue: {}});
    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');

    const playerSelection = document.getElementById("player-selection-featured");

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
        nodecg.listenFor(`${web}-featured-settings-update`, (data) => {
            updateValues(data);
        });

        nodecg.listenFor(`${web}-swap-video-source-result`, (data) => {
            if (data !== undefined) {
                if (data.source1.id == "0") {
                    updateValues(data.source2.playerData);
                }
                if (data.source2.id == "0") {
                    updateValues(data.source1.playerData);
                }
                updateReplicant();
            }
        });

        NodeCG.waitForReplicants(playerFeaturedReplicant, runDataReplicant).then(() => {
            if (playerFeaturedReplicant.value !== undefined) {
                if (runDataReplicant.value !== undefined) {
                    const options = createPlayerSelection(runDataReplicant.value.teams);
                    for (let i = 0; i < options.length; i++) {
                        playerSelection.append(options[i]);
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

    function updateValues(values) {
        document.getElementById("player-selection-featured").value = values.playerSelected;
        currentPB.value = values.currentPB;
        AFK.checked = values.afk;
        openSlot.checked = values.openSlot;
    }

    document.getElementById("featured-player-submit").onclick = function (e) {
        updateReplicant();

        e.preventDefault();
    }

    function updateReplicant() {
        const playerSelection = document.getElementById("player-selection-featured");

        playerFeaturedReplicant.value = {
            "id": "0",
            "playerSelected": playerSelection.value,
            "currentPB": currentPB.value,
            "afk": AFK.checked,
            "openSlot": openSlot.checked
        };
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