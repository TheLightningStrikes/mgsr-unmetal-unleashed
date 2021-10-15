window.addEventListener('DOMContentLoaded', (event) => {
    const featuredPlayerSettingsReplicant = nodecg.Replicant("player-featured-settings");
    const smallPlayerSettingsReplicant = nodecg.Replicant("player-small-settings");

    const runDataReplicant = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');

    const currentAmountOfPlayersReplicant = nodecg.Replicant("current-amount-of-players");

    const server = 'server';
    const web = 'web';

    const maxAmountOfPlayers = 6;

    let currentAmountOfPlayers = 0;
    const commentators = document.getElementById("commentators");

    NodeCG.waitForReplicants(featuredPlayerSettingsReplicant, smallPlayerSettingsReplicant, runDataReplicant, currentAmountOfPlayersReplicant).then(() => {
        currentAmountOfPlayers = currentAmountOfPlayersReplicant.value;
        createPlayers(maxAmountOfPlayers);
        adjustPlayers(maxAmountOfPlayers, Number(currentAmountOfPlayers), false);
        insertFeaturedPlayerData(featuredPlayerSettingsReplicant.value);
        insertSmallPlayerData(smallPlayerSettingsReplicant.value);

        nodecg.listenFor(`${web}-number-of-players`, (newValue) => {
            console.log(`${newValue} players received`);
            adjustPlayers(Number(currentAmountOfPlayers), Number(newValue), true);
            currentAmountOfPlayers = newValue;
            currentAmountOfPlayersReplicant.value = newValue;
            insertSmallPlayerData(smallPlayerSettingsReplicant.value);
        })

        nodecg.listenFor(`${web}-swap-video-animation`, (swap) => {
            document.getElementById(`player-swap-${swap.source1.id}`).classList.add("show");
            document.getElementById(`player-swap-${swap.source2.id}`).classList.add("show");

            setTimeout(function () {
                document.getElementById(`player-swap-${swap.source1.id}`).classList.remove("show");
                document.getElementById(`player-swap-${swap.source2.id}`).classList.remove("show");
            }, 6000);
        })

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

        runDataReplicant.on("change", (newValue) => {
            console.log(newValue);
            if (newValue !== "" && newValue) {
                const newCommentators = newValue.customData.commentators;
                if (commentators.textContent !== newCommentators) {
                    changeText("commentators-wrapper", "commentators", newValue.customData.commentators);
                }
            }
        });
    });

    function changeText(wrapperID, targetID, text) {
        document.getElementById(wrapperID).classList.remove("show-text");
        document.getElementById(wrapperID).classList.add("hide-text");
        setTimeout(function () {
            document.getElementById(targetID).textContent = text;
            document.getElementById(wrapperID).classList.remove("hide-text");
            document.getElementById(wrapperID).classList.add("show-text");
        }, 1500);
    }

    function insertFeaturedPlayerData(data) {
        const playerSelected = data.playerSelected;
        const currentPB = data.currentPB;
        const afk = data.afk;
        const openSlot = data.openSlot;

        console.log(`Just got new featured player settings! playerSelected: ${playerSelected}, currentPB: ${currentPB}, afk: ${afk}, openSlot: ${openSlot}`);

        insertRunData(runDataReplicant.value, playerSelected, "featured");

        const playerPB = document.getElementById(`player-pb-featured`);
        if (playerPB.textContent !== currentPB) {
            changeText(`player-pb-featured`, `player-pb-featured`, currentPB);
        }

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
                if (playerPB.textContent !== smallPlayerData.currentPB) {
                    changeText(`player-pb-${smallPlayerData.id}`, `player-pb-${smallPlayerData.id}`, smallPlayerData.currentPB);
                }

                togglePlaceholder(smallPlayerData.id, "afk", smallPlayerData.afk);
                togglePlaceholder(smallPlayerData.id, "open-slot", smallPlayerData.openSlot);
            } else {
                break;
            }
        }
    }

    function togglePlaceholder(id, name, toggle) {
        const placeholder = document.getElementById(`player-${name}-${id}`);
        if (toggle) {
            placeholder.classList.add("show");
        } else {
            placeholder.classList.remove("show");
        }
    }

    function adjustPlayers(oldValue, newValue, playAnimations) {
        console.log(oldValue, newValue);
        setBackground(oldValue, newValue, playAnimations);
        if (oldValue > newValue) {
            for (let i = newValue + 1; i <= oldValue; i++) {
                if (playAnimations) {
                    toggleSmallPlayer(i, true);
                    document.getElementById(`small-player-${i}-details`).classList.remove("hidden");
                } else {
                    document.getElementById(`small-player-${i}-details`).classList.add("hidden");
                }
            }
        } else if (oldValue < newValue) {
            for (let i = (oldValue + 1); i <= newValue; i++) {
                if (playAnimations) {
                    document.getElementById(`small-player-${i}-details`).classList.remove("hidden");
                    toggleSmallPlayer(i, false);
                } else {
                    document.getElementById(`small-player-${i}-details`).classList.remove("hidden");
                }
            }
        }
    }

    function setBackground(oldValue, newValue, playAnimations) {
        if (playAnimations) {
            setTimeout(function () {
                document.getElementById(`background-${newValue}`).classList.add("show");
                if (newValue !== oldValue) {
                    document.getElementById(`background-${oldValue}`).classList.remove("show");
                }
            }, 1500);
        }
        else {
            document.getElementById(`background-${newValue}`).classList.add("show");
            if (newValue !== oldValue) {
                document.getElementById(`background-${oldValue}`).classList.remove("show");
            }
        }
    }

    function toggleSmallPlayer(id, toggle) {
        const smallPlayerDetails = document.getElementById(`small-player-${id}-details`)
        const startupOverlay = document.getElementById(`player-startup-${id}`)
        if (toggle) {
            smallPlayerDetails.classList.remove("showing");
            startupOverlay.classList.remove("showing");
            smallPlayerDetails.classList.add("hiding");
            startupOverlay.classList.add("hiding");
            togglePlaceholder(id,"afk",false);
            togglePlaceholder(id,"open-slot",false);

        } else {
            smallPlayerDetails.classList.remove("hiding");
            startupOverlay.classList.remove("hiding");
            smallPlayerDetails.classList.add("showing");
            startupOverlay.classList.add("showing");
            togglePlaceholder(id,"afk",true);
            togglePlaceholder(id,"open-slot",true);
        }
    }

    function insertRunData(data, name, id) {
        if (data !== undefined) {
            const teams = data.teams;

            for (let i = 0; i <= teams.length; i++) {
                const player = teams[i].players["0"];

                if (player.name === name) {
                    const playerNameSpan = document.getElementById(`player-name-${id}`);
                    const twitchUserName = teams[i].players["0"].social.twitch;
                    if (playerNameSpan.textContent !== twitchUserName) {
                        changeText(`player-name-${id}`, `player-name-${id}`, twitchUserName);
                    }
                    break;
                }
            }
        }
    }

    function createPlayers(maxAmountOfPlayers) {
        const wrapper = document.getElementById("small-player-settings-wrapper");
        wrapper.innerText = "";
        for (let i = 0; i < maxAmountOfPlayers; i++) {
            const id = i + 1;
            wrapper.append(createSmallPlayer(id));
        }
    }

    function createSmallPlayer(id) {
        const smallPlayerWrapper = document.createElement("div")
        smallPlayerWrapper.setAttribute("id", `small-player-${id}`);
        smallPlayerWrapper.setAttribute("class", `row`);

        const smallPlayerPlaceholder = createSmallPlayerPlaceholder(id, "placeholder");
        const smallPlayerAFK = createSmallPlayerPlaceholder(id, "afk");
        smallPlayerAFK.append(createAFKElements());
        const smallPlayerStartup = createSmallPlayerPlaceholder(id, "startup");
        const smallPlayerOpenSlot = createSmallPlayerPlaceholder(id, "open-slot");
        const smallPlayerSwap = createSmallPlayerPlaceholder(id, "swap");
        const smallPlayerDetails = createSmallPlayerDetails(id);

        const twitchLogo = createTwitchLogo(`twitch-logo-${id}`);
        const playerName = createSpan(`player-name-${id}`, "player-name");
        const currentPB = createSpan(`player-pb-${id}`, "player-pb");

        smallPlayerDetails.append(twitchLogo);
        smallPlayerDetails.append(playerName);
        smallPlayerDetails.append(currentPB);

        smallPlayerPlaceholder.appendChild(smallPlayerAFK);
        smallPlayerPlaceholder.appendChild(smallPlayerOpenSlot);
        smallPlayerPlaceholder.appendChild(smallPlayerStartup);
        smallPlayerPlaceholder.appendChild(smallPlayerSwap);

        smallPlayerWrapper.appendChild(smallPlayerPlaceholder);
        smallPlayerWrapper.appendChild(smallPlayerDetails);

        return smallPlayerWrapper;
    }

    function createSmallPlayerPlaceholder(id, name) {
        const placeholder = document.createElement("div");
        placeholder.setAttribute("class", `small-player player-${name}`);
        placeholder.setAttribute("id", `player-${name}-${id}`)
        return placeholder;
    }

    function createSmallPlayerDetails(id) {
        const details = document.createElement("div");
        details.setAttribute("class", `small-player-details`);
        details.setAttribute("id", `small-player-${id}-details`);
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
        img.setAttribute("src", "/bundles/mgsr-unmetal-unleashed/graphics/img/TwitchGlitch.svg");
        img.setAttribute("id", id);
        return img;
    }

    function createAFKElements() {
        const div = document.createElement("div");
        div.classList.add("AFK-screen");

        const span = document.createElement("p");
        span.textContent = "AFK";

        const img = document.createElement("img");
        img.src = "/bundles/mgsr-unmetal-unleashed/graphics/img/guard-box-5s.gif";
        img.alt = "guard-box";

        div.append(span);
        div.append(img);
        return div;
    }
});