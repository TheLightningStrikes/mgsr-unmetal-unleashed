window.addEventListener('DOMContentLoaded', () => {
    const server = 'server';
    const web = 'web';
    const maxAmountOfPlayers = 7;

    const submitButton = document.getElementById("obs-settings-submit");

    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");
    const RTMPSettingsDataReplicant = nodecg.Replicant("rtmp-data");

    initializeValues();

    function initializeValues() {
        NodeCG.waitForReplicants(mediaSourcesReplicant, RTMPSettingsDataReplicant).then(() => {
            createSettings(maxAmountOfPlayers);
            console.log(mediaSourcesReplicant.value);
        });

        nodecg.listenFor(`${web}-obs-status`, (status) => {
            if (status.connected) {
                for (let i = 0; i < maxAmountOfPlayers; i++) {
                    const sourceSelection = document.getElementById(`media-source-selection-${i}`);
                    const rtmpRegion = document.getElementById(`rtmp-region-${i}`);
                    const rtmpKey = document.getElementById(`rtmp-key-${i}`)

                    sourceSelection.disabled = false;
                    rtmpRegion.disabled = false;
                    rtmpKey.disabled = false;
                }
            } else {
                for (let i = 0; i < maxAmountOfPlayers; i++) {
                    const sourceSelection = document.getElementById(`media-source-selection-${i}`);
                    const rtmpRegion = document.getElementById(`rtmp-region-${i}`);
                    const rtmpKey = document.getElementById(`rtmp-key-${i}`)

                    sourceSelection.disabled = true;
                    rtmpRegion.disabled = true;
                    rtmpKey.disabled = true;
                }
            }
        });

        nodecg.listenFor(`${web}-media-sources`, (data) => {
            for (let i = 0; i < maxAmountOfPlayers; i++) {
                const sourceSelection = document.getElementById(`media-source-selection-${i}`);
                sourceSelection.innerHTML = "";
                const options = createMediaSourceOptions(i, data);
                for (let id in options) {
                    sourceSelection.append(options[id])
                }
            }
            //updateReplicant();
        });

        nodecg.listenFor(`${web}-swap-video-source-result`, (data) => {
            if (data !== undefined) {
                for (let i = 0; i < maxAmountOfPlayers; i++) {
                    if (data.source1.id == i) {
                        updateValues(i, data.source2.rtmpData);
                    }
                    if (data.source2.id == i) {
                        updateValues(i, data.source1.rtmpData);
                    }
                }
                updateReplicant();
            }
        });
        nodecg.listenFor(`${web}-rtmp-change-result`, (data) => {
            for (let i = 0; i < maxAmountOfPlayers; i++) {
                if (data.id == i) {
                    const rtmp = {"id": `${data.id}`, "rtmp": {"region": `${data.rtmp.region}`, "key": `${data.rtmp.key}`}, "sourceName": `${data.sourceName}`};
                    updateValues(i, data);
                    RTMPSettingsDataReplicant.value[i] = rtmp;
                    break;
                }
            }
        });
    }

    submitButton.onclick = function (e) {
        updateReplicant();

        e.preventDefault();
    };

    function checkRTMPForChange(rtmpData, obsSetting) {
        if (obsSetting !== undefined) {
            if (rtmpData.rtmp.region === obsSetting.rtmp.region && rtmpData.rtmp.key === obsSetting.rtmp.key && rtmpData.sourceName === obsSetting.sourceName) {
                return false;
            } else {
                return true;
            }
        }
        else {
            return true;
        }
    }

    function updateValues(id, values) {
        document.getElementById(`media-source-selection-${id}`).value = values.sourceName;
        document.getElementById(`rtmp-region-${id}`).value = values.rtmp.region;
        document.getElementById(`rtmp-key-${id}`).value = values.rtmp.key;
    }

    function updateReplicant() {
        const rtmp = {};

        for (let i = 0; i < maxAmountOfPlayers; i++) {
            const sourceName = document.getElementById(`media-source-selection-${i}`).value;
            const RTMPRegion = document.getElementById(`rtmp-region-${i}`).value;
            const RTMPKey = document.getElementById(`rtmp-key-${i}`).value;

            rtmp[i] = {
                "id": `${i}`,
                "rtmp": {"region": `${RTMPRegion}`, "key": `${RTMPKey}`},
                "sourceName": `${sourceName}`
            }
            if (RTMPSettingsDataReplicant.value !== undefined) {
                if (checkRTMPForChange(rtmp[i], RTMPSettingsDataReplicant.value[i])) {
                    nodecg.sendMessage(`${server}-rtmp-change`, rtmp[i]);
                }
            }
        }
        RTMPSettingsDataReplicant.value = rtmp;
    }

    function createSettings(amount) {
        const wrapper = document.getElementById("obs-settings-wrapper");
        wrapper.innerText = "";
        for (let i = 0; i < amount; i++) {
            wrapper.append(createSmallPlayer(i));

            if (RTMPSettingsDataReplicant.value !== undefined && RTMPSettingsDataReplicant.value[i] !== undefined) {
                const rtmp = RTMPSettingsDataReplicant.value[i];
                document.getElementById(`media-source-selection-${i}`).value = `${rtmp.sourceName}`;
                document.getElementById(`rtmp-region-${i}`).value = `${rtmp.rtmp.region}`;
                document.getElementById(`rtmp-key-${i}`).value = `${rtmp.rtmp.key}`;
            }
        }
        updateReplicant();
    }

    function createSmallPlayer(id) {
        const smallPlayerWrapper = document.createElement("div");
        smallPlayerWrapper.setAttribute("id", `obs-setting-${id}`);
        smallPlayerWrapper.setAttribute("class", "small-player");

        let playerHeader;

        if (id === 0) {
            playerHeader = createHeader(`Featured Player`);
        }
        else {
            playerHeader = createHeader(`Player ${id}`);
        }

        const RTMPRegion = createRTMPRegionSelection(`rtmp-region-${id}`);
        const RTMPKey = createRTMPKeyInput(`rtmp-key-${id}`);

        const sourceSelectionLabel = (createLabel(`media-source-selection-${id}`, "OBS Media Source"));
        const sourceSelectionInput = createSelectInput(`media-source-selection-${id}`);
        let sourceSelectionOptions;

        if (mediaSourcesReplicant.value !== undefined) {
            sourceSelectionOptions = (createMediaSourceOptions(id, mediaSourcesReplicant.value));
        } else {
            sourceSelectionOptions = [];
        }

        for (let id in sourceSelectionOptions) {
            sourceSelectionInput.appendChild(sourceSelectionOptions[id]);
        }

        const elements = [playerHeader, sourceSelectionLabel, sourceSelectionInput, RTMPRegion, RTMPKey];

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

    function createRTMPRegionSelection(id) {
        const label = document.createElement("label");
        label.innerHTML = "RTMP Region";
        label.setAttribute("class", "rtmp");
        const select = document.createElement("select")
        select.setAttribute("id", id);
        const regions = ["NYC", "SFO", "TOR", "AMS", "SGP", "LON", "FRA", "BLR"];

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

    function createMediaSourceOptions(id, data) {
        const options = [];
        console.log(data);
        for (let dataID in data) {
            const sourceName = data[dataID].sourceName;
            const option = document.createElement("option");
            option.value = sourceName;
            option.innerHTML = sourceName;
            console.log(sourceName);
            console.log(RTMPSettingsDataReplicant.value[id].sourceName);
            if (RTMPSettingsDataReplicant.value !== undefined && RTMPSettingsDataReplicant.value[id] !== undefined && sourceName === RTMPSettingsDataReplicant.value[id].sourceName) {
                option.selected = true;
            }

            options.push(option);
        }
        return options;
    }

    function createLabel(labelFor, text) {
        const label = document.createElement("label");
        label.setAttribute("for", labelFor);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    function createSelectInput(id) {
        const select = document.createElement("select");
        select.setAttribute("class", "small-player-select");
        select.setAttribute("id", id);
        select.setAttribute("name", id)
        return select;
    }
});