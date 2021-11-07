window.addEventListener('DOMContentLoaded', (event) => {
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings");
    const playerFeaturedReplicant = nodecg.Replicant("player-featured-settings");
    const RTMPSettingsDataReplicant = nodecg.Replicant("rtmp-data", {defaultValue: {}});

    const source1 = document.getElementById("source-1");
    const source2 = document.getElementById("source-2");

    const source1mute = document.getElementById("mute-source1");
    const source1unMute = document.getElementById("unmute-source1");
    const source2mute = document.getElementById("mute-source2");
    const source2unMute = document.getElementById("unmute-source2");

    source1mute.onclick = function() {onCheckboxClick(`source1`, "mute", source1mute.checked)};
    source1unMute.onclick = function() {onCheckboxClick(`source1`, "unmute", source1unMute.checked)};
    source2mute.onclick = function() {onCheckboxClick(`source2`, "mute", source2mute.checked)};
    source2unMute.onclick = function() {onCheckboxClick(`source2`, "unmute", source2unMute.checked)};

    const server = 'server';
    const web = 'web';

    let source1playerSelected;
    let source2playerSelected;

    initializeValues();

    function initializeValues() {
        nodecg.listenFor(`${web}-obs-status`, (status) => {
            if (status.connected) {
                source1.disabled = false;
                source2.disabled = false;
                source1mute.disabled = false;
                source1unMute.disabled = false;
                source2mute.disabled = false;
                source2unMute.disabled = false;
            } else {
                source1.disabled = true;
                source2.disabled = true;
                source1mute.disabled = true;
                source1unMute.disabled = true;
                source2mute.disabled = true;
                source2unMute.disabled = true;
            }
        });

        NodeCG.waitForReplicants(smallPlayerSettingsReplicant, playerFeaturedReplicant).then(() => {
            source1.innerHTML = "";
            source2.innerHTML = "";

            const options1 = createPlayerSelection(playerFeaturedReplicant.value, smallPlayerSettingsReplicant.value);
            const options2 = createPlayerSelection(playerFeaturedReplicant.value, smallPlayerSettingsReplicant.value);

            for (let i = 0; i < options1.length; i++) {
                source1.append(options1[i]);
                source2.append(options2[i]);
            }

            playerFeaturedReplicant.on('change', (data) => {
                source1.innerHTML = "";
                source2.innerHTML = "";

                const options1 = createPlayerSelection(data, smallPlayerSettingsReplicant.value);
                const options2 = createPlayerSelection(data, smallPlayerSettingsReplicant.value);

                for (let i = 0; i < options1.length; i++) {
                    source1.append(options1[i]);
                    source2.append(options2[i]);
                }

                source1.value = source1playerSelected;
                source2.value = source2playerSelected;
            });

            smallPlayerSettingsReplicant.on('change', (data) => {
                source1.innerHTML = "";
                source2.innerHTML = "";

                const options1 = createPlayerSelection(playerFeaturedReplicant.value, data);
                const options2 = createPlayerSelection(playerFeaturedReplicant.value, data);

                for (let i = 0; i < options1.length; i++) {
                    source1.append(options1[i]);
                    source2.append(options2[i]);
                }

                source1.value = source1playerSelected;
                source2.value = source2playerSelected;
            });
        });
    }

    function createPlayerSelection(featuredPlayerData, smallPlayerData) {
        const options = [];
        options.push(createPlayerOption(featuredPlayerData));
        for (let id in smallPlayerData) {
            const player = smallPlayerData[id];
            if (smallPlayerData[id].playerSelected !== undefined) {
                options.push(createPlayerOption(player));
            }
        }
        return options;
    }

    function createPlayerOption(player) {
        const option = document.createElement("option");
        option.value = player.id;
        option.innerHTML = player.playerSelected;
        return option;
    }

    document.getElementById("swap-media-sources-submit").onclick = function (e) {
        if (source1.value === source2.value) {
            return;
        }
        const rtmpPlayer1 = getRTMPData(source1.value);
        const rtmpPlayer2 = getRTMPData(source2.value);

        const player1Data = findPlayerByPlayerName(source1.value);
        const player2Data = findPlayerByPlayerName(source2.value);

        source1playerSelected = source1.value;
        source2playerSelected = source2.value;

        let muteSettingsSource1 = createMuteSettings(source1mute.checked, source1unMute.checked);
        let muteSettingsSource2 = createMuteSettings(source2mute.checked, source2unMute.checked);

        const swapData = {
            "source1": {
                "sourceName": rtmpPlayer1.sourceName,
                "id": source1playerSelected,
                "rtmpData": rtmpPlayer1,
                "playerData": player1Data,
                "muteSettings": muteSettingsSource1
            },
            "source2": {
                "sourceName": rtmpPlayer2.sourceName,
                "id": source2playerSelected,
                "rtmpData": rtmpPlayer2,
                "playerData": player2Data,
                "muteSettings": muteSettingsSource2
            }
        };
        nodecg.sendMessage(`${server}-swap-video-animation`, swapData);

        setTimeout(function () {
            nodecg.sendMessage(`${server}-swap-video-source`, swapData);
        }, 1500);

        e.preventDefault();
    };

    function createMuteSettings(mute, unmute) {
        if (mute === true && unmute === false) {
            return {change: true, value: true};
        }
        else if (mute === false && unmute === true) {
            return {change: true, value: false};
        }
        else {
            return {change: false, value: false};
        }
    }

    function getRTMPData(id) {
        for (let i in RTMPSettingsDataReplicant.value) {
            const rtmp = RTMPSettingsDataReplicant.value[i];
            console.log(rtmp);
            console.log(i);
            if (rtmp.id == id) {
                return Object.assign({}, rtmp);
            }
        }
    }


    function findPlayerByPlayerName(id) {
        if (playerFeaturedReplicant.value.id === id) {
            return Object.assign({}, playerFeaturedReplicant.value);
        } else {
            const smallPlayerData = smallPlayerSettingsReplicant.value;
            for (let i in smallPlayerData) {
                const player = smallPlayerData[i];
                if (player.id === id) {
                    return Object.assign({}, player);
                }
            }
        }
    }

    function onCheckboxClick(id, checkboxName, checked) {
        const muteCheckbox = document.getElementById(`mute-${id}`);
        const unmuteCheckbox = document.getElementById(`unmute-${id}`);
        if (checked) {
            switch (checkboxName) {
                case `mute`:
                    muteCheckbox.checked = true;
                    unmuteCheckbox.checked = false;
                    break;
                case `unmute`:
                    muteCheckbox.checked = false;
                    unmuteCheckbox.checked = true;
                    break;
            }
        } else {
            document.getElementById(`${checkboxName}-${id}`).checked = false;
        }
    }
});