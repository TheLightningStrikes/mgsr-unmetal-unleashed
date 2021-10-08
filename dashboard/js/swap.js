window.addEventListener('DOMContentLoaded', (event) => {
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings");
    const playerFeaturedReplicant = nodecg.Replicant("player-featured-settings");

    const source1 = document.getElementById("source-1");
    const source2 = document.getElementById("source-2");

    const server = 'server';
    const web = 'web';

    initializeValues();
    function initializeValues() {
        nodecg.listenFor(`${web}-obs-status`, (status) => {
            if (status.connected) {
                source1.disabled = false;
                source2.disabled = false;
            }
            else {
                source1.disabled = true;
                source2.disabled = true;
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
              });
        });
    }

    function createPlayerSelection(featuredPlayerData, smallPlayerData) {
        const options = [];
        options.push(createPlayerOption(featuredPlayerData));
        for (let id in smallPlayerData) {
            const player = smallPlayerData[id];
            options.push(createPlayerOption(player));
        }
        return options;
    }

    function createPlayerOption(player) {
        const option = document.createElement("option");
        option.value = player.playerSelected;
        option.innerHTML = player.playerSelected;
        return option;
    }

    document.getElementById("swap-media-sources-submit").onclick = function (e) {
        if (source1.value === source2.value) {
            return;
        }
        const player1 = findPlayerByPlayerName(source1.value);
        const player2 = findPlayerByPlayerName(source2.value);

        const swapData = {"source1": {"sourceName": player1.sourceName, "playerName": player1.playerSelected, "id": player1.id, "playerData": player1},
            "source2": {"sourceName": player2.sourceName, "playerName": player2.playerSelected, "id": player2.id, "playerData": player2}};
        nodecg.sendMessage(`${server}-swap-video-source`, swapData);

        e.preventDefault();
    };

    function findPlayerByPlayerName(playerName) {
        if (playerFeaturedReplicant.value.playerSelected === playerName) {
            return Object.assign({}, playerFeaturedReplicant.value);
        }
        else {
            const smallPlayerData = smallPlayerSettingsReplicant.value;
            for (let id in smallPlayerData) {
                const player = smallPlayerData[id];
                if (player.playerSelected === playerName) {
                    return Object.assign({}, player);
                }
            }
        }
    }
});