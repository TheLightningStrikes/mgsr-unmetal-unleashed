window.addEventListener('DOMContentLoaded', () => {
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings", {defaultValue: {}});
    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');

    const submitButton = document.getElementById("small-player-settings-submit");
    const noPlayersSelected = document.getElementById("no-players-selected");

    const server = 'server';
    const web = 'web';
    const maxAmountOfPlayers = 6;

    initializeValues();

    function initializeValues() {
        nodecg.listenFor(`${web}-small-settings-update`, (data) => {
            for (let i = 0; i < maxAmountOfPlayers; i++) {
                updateValues(data[i].id, data[i]);
            }
        });

        nodecg.listenFor(`${web}-swap-video-source-result`, (data) => {
            if (data !== undefined) {
                for (let i = 0; i < maxAmountOfPlayers; i++) {
                    const id = Number(i + 1) + "";
                    if (data.source1.id === id) {
                        updateValues(id, data.source2.playerData);
                    }
                    if (data.source2.id === id) {
                        updateValues(id, data.source1.playerData);
                    }
                }
                updateReplicant();
            }
        });

        NodeCG.waitForReplicants(smallPlayerSettingsReplicant, runDataReplicant).then(() => {
            createPlayers(maxAmountOfPlayers);

            runDataReplicant.on("change", (newValue) => {
                if (newValue !== undefined) {
                    for (let i = 0; i < maxAmountOfPlayers; i++) {
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
        document.getElementById(`player-selection-${id}`).value = `${values.playerSelected}`;
        document.getElementById(`player-pb-${id}`).value = `${values.currentPB}`;
        document.getElementById(`afk-${id}`).checked = values.afk;
        document.getElementById(`open-slot-${id}`).checked = values.openSlot;
    }

    function createSelectInput(id) {
        const select = document.createElement("select");
        select.setAttribute("class", "small-player-select");
        select.setAttribute("id", id);
        select.setAttribute("name", id)
        return select;
    }

    function createPlayerSelectOptions(id, data) {
        const options = [];
        for (let dataID in data) {
            const option = document.createElement("option");
            const player = data[dataID].players[0];
            option.value = player.name;
            option.innerHTML = player.name;
            if (smallPlayerSettingsReplicant.value !== undefined && smallPlayerSettingsReplicant.value[id - 1] !== undefined && player.name === smallPlayerSettingsReplicant.value[id - 1].playerSelected) {
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

        for (let i = 0; i < maxAmountOfPlayers; i++) {
            const id = i + 1;
            const playerSelected = document.getElementById(`player-selection-${id}`).value;
            const currentPB = document.getElementById(`player-pb-${id}`).value;
            const afk = document.getElementById(`afk-${id}`).checked;
            const openSlot = document.getElementById(`open-slot-${id}`).checked;

            let savedRTMP = {};
            if (smallPlayerSettingsReplicant.value[i] !== undefined) {
                savedRTMP = smallPlayerSettingsReplicant.value[i].rtmp;
            }

            //we use "" to avoid data redundancy
            data[i] = {
                "id": `${id}`,
                "playerSelected": `${playerSelected}`,
                "currentPB": `${currentPB}`,
                "rtmp": savedRTMP,
                "afk": afk,
                "openSlot": openSlot
            };
        }

        smallPlayerSettingsReplicant.value = data;
        nodecg.sendMessage(`${server}-small-settings-update`, data);
    }

    function createPlayers(amount) {
        const wrapper = document.getElementById("small-player-settings-wrapper");
        wrapper.innerText = "";
        for (let i = 0; i < amount; i++) {
            const id = i + 1;
            wrapper.append(createSmallPlayer(id));

            if (smallPlayerSettingsReplicant.value !== undefined && smallPlayerSettingsReplicant.value[id-1] !== undefined) {
                const smallPlayer = smallPlayerSettingsReplicant.value[id-1];
                document.getElementById(`player-selection-${id}`).value = `${smallPlayer.playerSelected}`;
                document.getElementById(`player-pb-${id}`).value = `${smallPlayer.currentPB}`;
                document.getElementById(`afk-${id}`).checked = smallPlayer.afk;
                document.getElementById(`open-slot-${id}`).checked = smallPlayer.openSlot;
            }
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

        const currentPBLabel = createLabel(`player-pb-${id}`, "Current PB");
        const currentPBTextInput = createTextInput(`player-pb-${id}`, `player-pb-${id}`, "Current Personal Best");

        const AFKCheckboxInput = createCheckbox(`afk-${id}`, `afk-${id}`);
        const AFKCheckboxLabel = createLabelWithCheckbox(`afk-${id}`, AFKCheckboxInput, "AFK");

        const openSlotCheckboxInput = createCheckbox(`open-slot-${id}`, `open-slot-${id}`);
        const openSlotCheckboxLabel = createLabelWithCheckbox(`open-slot-${id}`, openSlotCheckboxInput, "Open Slot");

        const elements = [playerHeader, playerSelectionLabel, playerSelectionInput, currentPBLabel,
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
});