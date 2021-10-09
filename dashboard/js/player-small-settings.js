window.addEventListener('DOMContentLoaded', () => {
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings", {defaultValue: {}});
    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");

    const submitButton = document.getElementById("small-player-settings-submit");
    const noPlayersSelected = document.getElementById("no-players-selected");

    const RTMPSmallPlayerSettingsDataReplicant = nodecg.Replicant("rtmp-data-small-player");

    const server = 'server';
    const web = 'web';
    let currentAmountOfPlayers = 0;

    initializeValues();

    function initializeValues() {
        nodecg.listenFor(`${web}-number-of-players`, (newValue) => {
            currentAmountOfPlayers = newValue;
            if (newValue > 0) {
                noPlayersSelected.setAttribute("style", "display: none;");
                submitButton.setAttribute("style", "display: inline-block;");
                createPlayers(newValue);
            } else {
                noPlayersSelected.setAttribute("style", "display: inline-block;");
                submitButton.setAttribute("style", "display: none;");
                createPlayers(newValue);
            }
        });

        nodecg.listenFor(`${web}-media-sources`, (data) => {
            for (let i = 0; i < currentAmountOfPlayers; i++) {
                const id = i + 1;
                const sourceSelection = document.getElementById(`media-source-selection-${id}`);
                sourceSelection.innerHTML = "";
                const options = createMediaSourceOptions(id, data.mediaSources);
                for (let id in options) {
                    sourceSelection.append(options[id])
                }
            }
            updateReplicant();
        });

        nodecg.listenFor(`${web}-obs-status`, (status) => {
            if (status.connected) {
                for (let i = 0; i < currentAmountOfPlayers; i++) {
                    const id = i + 1;
                    const sourceSelection = document.getElementById(`media-source-selection-${id}`);
                    const rtmpRegion = document.getElementById(`rtmp-region-${id}`);
                    const rtmpKey = document.getElementById(`rtmp-key-${id}`)

                    sourceSelection.disabled = false;
                    rtmpRegion.disabled = false;
                    rtmpKey.disabled = false;
                }
            } else {
                for (let i = 0; i < currentAmountOfPlayers; i++) {
                    const id = i + 1;
                    const sourceSelection = document.getElementById(`media-source-selection-${id}`);
                    const rtmpRegion = document.getElementById(`rtmp-region-${id}`);
                    const rtmpKey = document.getElementById(`rtmp-key-${id}`)

                    sourceSelection.disabled = true;
                    rtmpRegion.disabled = true;
                    rtmpKey.disabled = true;
                }
            }
        });

        nodecg.listenFor(`${web}-swap-video-source`, (data) => {
            if (data !== undefined) {
                for (let i = 0; i < currentAmountOfPlayers; i++) {
                    const id = i + 1;
                    if (data.source1.id === id) {
                        updateValues(id, data.source2.playerData);
                    }
                    if (data.source2.id === id) {
                        updateValues(id, data.source1.playerData);
                    }
                }
            }
        });

        NodeCG.waitForReplicants(smallPlayerSettingsReplicant, runDataReplicant, RTMPSmallPlayerSettingsDataReplicant, mediaSourcesReplicant).then(() => {
            currentAmountOfPlayers = Object.keys(smallPlayerSettingsReplicant.value).length;
            createPlayers(currentAmountOfPlayers);
            for (let id in smallPlayerSettingsReplicant.value) {
                const smallPlayerData = smallPlayerSettingsReplicant.value[id];
                const playerID = smallPlayerData.id;

                document.getElementById(`player-selection-${playerID}`).value = smallPlayerData.playerSelected;

                document.getElementById(`media-source-selection-${playerID}`).value = smallPlayerData.sourceName;

                document.getElementById(`rtmp-region-${playerID}`).value = smallPlayerData.rtmp.region;

                if (smallPlayerData.rtmp.key !== undefined) {
                    document.getElementById(`rtmp-key-${playerID}`).value = smallPlayerData.rtmp.key;
                }

                if (smallPlayerData.currentPB !== undefined) {
                    document.getElementById(`current-pb-${playerID}`).value = smallPlayerData.currentPB;
                }

                document.getElementById(`afk-${playerID}`).checked = smallPlayerData.afk;
                document.getElementById(`open-slot-${playerID}`).checked = smallPlayerData.openSlot;
            }

            runDataReplicant.on("change", (newValue) => {
                if (newValue !== undefined) {
                    for (let i = 0; i < currentAmountOfPlayers; i++) {
                        const id = i + 1;

                        const playerSelection = document.getElementById(`player-selection-${id}`);
                        playerSelection.innerHTML = "";
                        const options = createPlayerSelectOptions(id, newValue.teams);
                        for (let id in options) {
                            playerSelection.append(options[id])
                        }
                    }
                }
            });
        });
    }

    function updateValues(id, values) {
        document.getElementById(`player-selection-${id}`).value = values.playerSelected;
        document.getElementById(`media-source-selection-${id}`).value = values.sourceName;
        document.getElementById(`rtmp-region-${id}`).value = values.rtmp.region;
        document.getElementById(`rtmp-key-${id}`).value = values.rtmp.key;
        document.getElementById(`current-pb-${id}`).value = values.currentPB;
        document.getElementById(`afk-${id}`).checked = values.afk;
        document.getElementById(`open-slot-${id}`).checked = values.openSlot;
        updateReplicant();
    }

    function createSelectInput(id) {
        const select = document.createElement("select");
        select.setAttribute("class", "small-player-select");
        select.setAttribute("id", id);
        select.setAttribute("name", id)
        return select;
    }

    function createMediaSourceOptions(id, data) {
        const options = [];
        for (let dataID in data) {
            const sourceName = data[dataID].sourceName;
            const option = document.createElement("option");
            option.value = sourceName;
            option.innerHTML = sourceName;
            if (smallPlayerSettingsReplicant.value[id - 1] !== undefined && sourceName === smallPlayerSettingsReplicant.value[id - 1].sourceName) {
                option.selected = true;
            }

            options.push(option);
        }
        return options;
    }

    function createPlayerSelectOptions(id, data) {
        const options = [];
        for (let dataID in data) {
            const option = document.createElement("option");
            const player = data[dataID].players[0];
            option.value = player.name;
            option.innerHTML = player.name;
            if (smallPlayerSettingsReplicant.value[id - 1] !== undefined && player.name === smallPlayerSettingsReplicant.value[id - 1].playerSelected) {
                option.selected = true;
            }
            options.push(option);
        }
        return options;
    }

    function onCheckboxClick(id, checked) {
        const player = id.substring(id.length - 1, id.length);
        const openSlotCheckbox = document.getElementById(`open-slot-${player}`);
        const AFKCheckbox = document.getElementById(`afk-${player}`);

        const checkboxName = id.substring(0, id.length - 2);

        if (checked) {
            switch (checkboxName) {
                case "open-slot":
                    AFKCheckbox.checked = false;
                    openSlotCheckbox.checked = true;
                    break;
                case "afk":
                    openSlotCheckbox.checked = false;
                    AFKCheckbox.checked = true;
                    break;
            }
        } else {
            document.getElementById(id).checked = false;
        }
    }

    submitButton.onclick = function (e) {
        updateReplicant();

        e.preventDefault();
    };

    function updateReplicant() {
        const data = {};
        const rtmp = {};

        for (let i = 0; i < currentAmountOfPlayers; i++) {
            const id = i + 1;
            const playerSelected = document.getElementById(`player-selection-${id}`).value;
            const currentPB = document.getElementById(`current-pb-${id}`).value;
            const afk = document.getElementById(`afk-${id}`).checked;
            const openSlot = document.getElementById(`open-slot-${id}`).checked;

            const sourceName = document.getElementById(`media-source-selection-${id}`).value;
            const RTMPRegion = document.getElementById(`rtmp-region-${id}`).value;
            const RTMPKey = document.getElementById(`rtmp-key-${id}`).value;

            rtmp[i] = {"id": id, "rtmp": {"region": RTMPRegion, "key": RTMPKey}, "sourceName": sourceName}
            data[i] = {
                "id": id,
                "playerSelected": playerSelected,
                "rtmp": {"region": RTMPRegion, "key": RTMPKey},
                "sourceName": sourceName,
                "currentPB": currentPB,
                "afk": afk,
                "openSlot": openSlot
            };
        }

        smallPlayerSettingsReplicant.value = data;
        RTMPSmallPlayerSettingsDataReplicant.value = rtmp;
    }

    function createPlayers(amount) {
        const wrapper = document.getElementById("small-player-settings-wrapper");
        wrapper.innerText = "";
        for (let i = 0; i < amount; i++) {
            const id = i + 1;
            wrapper.append(createSmallPlayer(id));
        }
        updateReplicant();
    }

    function createSmallPlayer(id) {
        const smallPlayerWrapper = document.createElement("div");
        smallPlayerWrapper.setAttribute("id", `small-player-${id}`);
        smallPlayerWrapper.setAttribute("class", "small-player");

        const playerHeader = createHeader(`Player ${id}`)

        const playerSelectionLabel = (createLabel(`player-selection-${id}`, "Runner"));
        const playerSelectionInput = createSelectInput(`player-selection-${id}`);
        let playerSelectionOptions;

        if (runDataReplicant.value !== undefined) {
            playerSelectionOptions = (createPlayerSelectOptions(id, runDataReplicant.value.teams));
        } else {
            playerSelectionOptions = [];
        }

        for (let id in playerSelectionOptions) {
            playerSelectionInput.appendChild(playerSelectionOptions[id]);
        }

        const sourceSelectionLabel = (createLabel(`media-source-selection-${id}`, "OBS Media Source"));
        const sourceSelectionInput = createSelectInput(`media-source-selection-${id}`);
        let sourceSelectionOptions;

        if (mediaSourcesReplicant.value !== undefined) {
            sourceSelectionOptions = (createMediaSourceOptions(id, mediaSourcesReplicant.value.mediaSources));
        } else {
            sourceSelectionOptions = [];
        }

        for (let id in sourceSelectionOptions) {
            sourceSelectionInput.appendChild(sourceSelectionOptions[id]);
        }

        const RTMPRegion = createRTMPRegionSelection(`rtmp-region-${id}`);
        const RTMPKey = createRTMPKeyInput(`rtmp-key-${id}`);

        const currentPBLabel = createLabel(`current-pb-${id}`, "Current PB");
        const currentPBTextInput = createTextInput(`current-pb-${id}`, `current-pb-${id}`, "Current Personal Best");

        const AFKCheckboxInput = createCheckbox(`afk-${id}`, `afk-${id}`);
        const AFKCheckboxLabel = createLabelWithCheckbox(`afk-${id}`, AFKCheckboxInput, "AFK");

        const openSlotCheckboxInput = createCheckbox(`open-slot-${id}`, `open-slot-${id}`);
        const openSlotCheckboxLabel = createLabelWithCheckbox(`open-slot-${id}`, openSlotCheckboxInput, "Open Slot");

        const elements = [playerHeader, playerSelectionLabel, playerSelectionInput, sourceSelectionLabel, sourceSelectionInput, RTMPRegion, RTMPKey, currentPBLabel,
            currentPBTextInput, AFKCheckboxLabel, openSlotCheckboxLabel];

        for (let id in elements) {
            smallPlayerWrapper.appendChild(elements[id]);
        }

        return smallPlayerWrapper;
    }

    function createHeader(title) {
        const header = document.createElement("h3");
        header.textContent = title;
        return header;
    }

    function createLabel(labelFor, text) {
        const label = document.createElement("label");
        label.setAttribute("for", labelFor);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    function createLabelWithCheckbox(labelFor, checkbox, text) {
        const label = document.createElement("label");
        label.setAttribute("for", labelFor);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    function createTextInput(name, id, placeholder) {
        const textInput = document.createElement("input");
        textInput.setAttribute("type", "text");
        textInput.setAttribute("name", name);
        textInput.setAttribute("id", id);
        textInput.setAttribute("placeholder", placeholder);
        return textInput;
    }

    function createCheckbox(id) {
        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", id);
        checkbox.setAttribute("id", id);
        checkbox.onclick = function () {
            onCheckboxClick(id, checkbox.checked);
        };
        return checkbox;
    }

    function createRTMPRegionSelection(id) {
        const label = document.createElement("label");
        label.innerHTML = "RTMP Region";
        label.setAttribute("class", "rtmp");
        const select = document.createElement("select")
        select.setAttribute("id", id);
        const regions = ["NA", "EU", "SGP", "OCE"];

        for (let i = 0; i < regions.length; i++) {
            const option = document.createElement("option");
            option.value = regions[i];
            option.innerHTML = regions[i];
            select.append(option);
        }

        label.append(select);
        return label;
    }


    function createRTMPKeyInput(id) {
        const label = document.createElement("label");
        label.innerHTML = "RTMP Key";
        label.setAttribute("class", "rtmp");
        const textInput = document.createElement("input");
        textInput.setAttribute("id", id);
        textInput.setAttribute("type", "text");
        textInput.setAttribute("placeholder", "Key");
        label.append(textInput);
        return label;
    }
});