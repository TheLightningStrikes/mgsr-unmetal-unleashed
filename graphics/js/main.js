window.addEventListener('DOMContentLoaded', (event) => {
    const featuredPlayerSettingsReplicant = nodecg.Replicant("player-featured-settings");
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings");

    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');

    const currentAmountOfPlayersReplicant = nodecg.Replicant("current-amount-of-players");

    const server = 'server';
    const web = 'web';

    let currentAmountOfPlayers = 0;

    NodeCG.waitForReplicants(featuredPlayerSettingsReplicant, smallPlayerSettingsReplicant, runDataReplicant, currentAmountOfPlayersReplicant).then(() => {
        currentAmountOfPlayers = currentAmountOfPlayersReplicant.value;
        createPlayers(currentAmountOfPlayers);
        nodecg.listenFor(`${web}-number-of-players`, (newValue) => {
            console.log(`${newValue} players received`);
            currentAmountOfPlayers = newValue;
            currentAmountOfPlayersReplicant.value = newValue;
            createPlayers(newValue);
            insertSmallPlayerData(smallPlayerSettingsReplicant.value);
        });

        smallPlayerSettingsReplicant.on("change", (newValue) => {
            if (newValue !== "" && newValue) {
                insertSmallPlayerData(newValue);
            }
        });

        featuredPlayerSettingsReplicant.on("change", (newValue) => {
            console.log(newValue);
            if (newValue !== "" && newValue) {
                insertFeaturedPlayerData(newValue);
            }
        });
    });

    function insertFeaturedPlayerData(data) {
        const playerSelected = data.playerSelected;
        const currentPB = data.currentPB;
        const afk = data.afk;
        const openSlot = data.openSlot;

        console.log(`Just got new featured player settings! playerSelected: ${playerSelected}, currentPB: ${currentPB}, afk: ${afk}, openSlot: ${openSlot}`);
        document.getElementById(`player-pb-featured`).innerHTML = currentPB;

        insertRunData(runDataReplicant.value, playerSelected, "featured");

        togglePlaceholder("featured", "afk", afk);
        togglePlaceholder("featured", "open-slot", openSlot);
    }

    function insertSmallPlayerData(data) {
        console.log(`Just got small player settings!`);
        for (let smallPlayerID in data) {
            if (smallPlayerID < currentAmountOfPlayers) {
                const smallPlayerData = data[smallPlayerID];
                console.log(`playerSelected: ${smallPlayerData.playerSelected} id: ${smallPlayerData.id}, currentPB: ${smallPlayerData.currentPB}, afk: ${smallPlayerData.afk}, openSlot: ${smallPlayerData.openSlot}`);

                insertRunData(runDataReplicant.value, smallPlayerData.playerSelected, smallPlayerData.id);

                const playerPB = document.getElementById(`player-pb-${smallPlayerData.id}`);
                playerPB.innerHTML = smallPlayerData.currentPB;

                togglePlaceholder(smallPlayerData.id, "afk", smallPlayerData.afk);
                togglePlaceholder(smallPlayerData.id, "open-slot", smallPlayerData.openSlot);
            }
            else {
                break;
            }
        }
    }

    function togglePlaceholder(id, name, toggle) {
        const placeholder = document.getElementById(`player-${name}-${id}`);
        if(toggle) {
            placeholder.setAttribute("style", "opacity:100;");
        }
        else {
            placeholder.setAttribute("style", "");
        }
    }

    function insertRunData(data, name, id) {
        console.log(data.teams);
        const teams = data.teams;

        for (let i = 0; i <= teams.length; i++) {
            const player = teams[i].players["0"];

            if (player.name === name) {
                const playerNameSpan = document.getElementById(`player-name-${id}`);
                playerNameSpan.innerHTML = teams[i].players["0"].social.twitch;
                break;
            }
        }
    }

    function createPlayers(amount) {
        const wrapper = document.getElementById("small-player-settings-wrapper");
        wrapper.innerText = "";
        for (let i = 0; i < amount; i++) {
            const id = i+1;
            wrapper.append(createSmallPlayer(id));
            if (i % 2 === 0) {
                createDivider("vertical-divider");
            }
            else {
                createDivider("horizontal-divider");
            }
        }
    }

    function createSmallPlayer(id) {
        const smallPlayerWrapper = document.createElement("div")
        smallPlayerWrapper.setAttribute("id", `small-player-${id}`);
        smallPlayerWrapper.setAttribute("class", `row`);

        const smallPlayerPlaceholder = createSmallPlayerPlaceholder(id, "placeholder");
        const smallPlayerAFK = createSmallPlayerPlaceholder(id, "afk");
        const smallPlayerOpenSlot = createSmallPlayerPlaceholder(id, "open-slot");
        const smallPlayerDetails = createSmallPlayerDetails();

        const twitchLogo = createTwitchLogo(`twitch-logo-${id}`);
        const playerName = createSpan(`player-name-${id}`, "player-name");
        const currentPB = createSpan(`player-pb-${id}`, "player-pb");

        smallPlayerDetails.append(twitchLogo);
        smallPlayerDetails.append(playerName);
        smallPlayerDetails.append(currentPB);

        smallPlayerPlaceholder.appendChild(smallPlayerAFK);
        smallPlayerPlaceholder.appendChild(smallPlayerOpenSlot);

        smallPlayerWrapper.appendChild(smallPlayerPlaceholder);
        smallPlayerWrapper.appendChild(smallPlayerDetails);

        return smallPlayerWrapper;
    }

    function createDivider(cssClass) {
        const divider = document.createElement("div");
        divider.setAttribute("class", cssClass);
        return divider;
    }

    function createSmallPlayerPlaceholder(id, name) {
        const placeholder = document.createElement("div");
        placeholder.setAttribute("class", `small-player player-${name}`);
        placeholder.setAttribute("id", `player-${name}-${id}`)
        return placeholder;
    }

    function createSmallPlayerDetails() {
        const details = document.createElement("div");
        details.setAttribute("class", `small-player-details`);
        return details;
    }

    function createSpan(id, cssClass) {
        const span = document.createElement("span");
        span.setAttribute("id", id);
        span.setAttribute("class", cssClass)
        return span;
    }

    function createTwitchLogo(id) {
        const img = document.createElement("img");
        img.setAttribute("class", "twitch-logo");
        img.setAttribute("src", "/bundles/mgsr-unleashed/graphics/img/TwitchGlitchWhite.svg");
        img.setAttribute("id", id);
        return img;
    }
});