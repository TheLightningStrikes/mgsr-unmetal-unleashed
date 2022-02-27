window.addEventListener('DOMContentLoaded', (event) => {
    const numberOfPlayers = document.getElementById("number-of-small-players");
    const OBSHost = document.getElementById("obs-host");
    const OBSPassword = document.getElementById("obs-password");
    const connectButton = document.getElementById("obs-connect-button");
    const disconnectButton = document.getElementById("obs-disconnect-button");

    const numberOfPlayersReplicant = nodecg.Replicant("number-of-players", {defaultValue: 0});

    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");

    const sceneName = nodecg.bundleConfig.sceneName || "UnMetal Unleashed";

    const obs = new OBSWebSocket();

    const server = 'server';
    const web = 'web';

    document.getElementById("obs-host").value = nodecg.bundleConfig.obsHost || "localhost:4444";
    document.getElementById("obs-password").value = nodecg.bundleConfig.obsPassword || "";

    const resolutions = {
        "featured-player": {
            "height": "1024",
            "width": "576"
        },
        "small-player": {
            "height": "384",
            "width": "216"
        }
    }

    const coordinates = {
        "featured": {
            "x": "38",
            "y": "38"
        },
        "small-player-1": {
            "x": "1100",
            "y": "38"
        },
        "small-player-2": {
            "x": "1498",
            "y": "38"
        },
        "small-player-3": {
            "x": "1100",
            "y": "318"
        },
        "small-player-4": {
            "x": "1498",
            "y": "318"
        },
        "small-player-5": {
            "x": "1100",
            "y": "598"
        },
        "small-player-6": {
            "x": "1498",
            "y": "598"
        },
    }

    const regions = {
        "RIC": "ric-rtmp",
        "NYC": "nyc-rtmp",
        "SFO": "sfo-rtmp",
        "TOR": "tor-rtmp",
        "AMS": "ams-rtmp",
        "SGP": "sgp-rtmp",
        "LON": "lon-rtmp",
        "FRA": "fra-rtmp",
        "BLR": "blr-rtmp",
    }

    const rtmpHost = "metalgearspeedrunners.com";

    function getRTMPLink(region, key) {
        return `rtmp://${regions[region]}.${rtmpHost}/runners/${key}`;
    }

    document.getElementById("setup-button").onclick = function (e) {
        numberOfPlayersReplicant.value = numberOfPlayers.value;
        nodecg.sendMessage(`${server}-number-of-players`, numberOfPlayers.value);
        e.preventDefault();
    };

    initializeValues();

    function initializeValues() {
        nodecg.listenFor(`${web}-swap-video-source`, (data) => {
            console.log(data);
            swapMediaSource(data.source1, data.source2);
        });

        nodecg.listenFor(`${web}-rtmp-change`, (data) => {
            const copy = Object.assign({}, data);
            setMediaSource(data.sourceName, getRTMPLink(data.rtmp.region, data.rtmp.key))
                .catch((error) => {
                    console.log(error);
                })
                .then((resolve) => {
                    nodecg.sendMessage(`${server}-rtmp-change-result`, copy);
                });
        });

        NodeCG.waitForReplicants(numberOfPlayersReplicant).then(() => {
            numberOfPlayers.value = numberOfPlayersReplicant.value;
            console.log(obs !== undefined && obs._connected);
            if (obs !== undefined && obs._connected) {
                nodecg.sendMessage(`${server}-obs-status`, {connected: true});
            }
            else {
                nodecg.sendMessage(`${server}-obs-status`, {connected: false});
            }
        });
    }

    connectButton.onclick = function (e) {
        let connectionSettings = {};
        if (OBSPassword.value !== "undefined" || OBSPassword.value !== "") {
            connectionSettings = {address: OBSHost.value, password: OBSPassword.value};
        } else {
            connectionSettings = {address: OBSHost.value};
        }
        obs.connect(connectionSettings).then(() => {
            console.log(`Successfully connected to ${OBSHost.value}`);
            OBSHost.disabled = true;
            OBSPassword.disabled = true;
            disconnectButton.style.display = "inline-block";
            connectButton.style.display = "none";

            nodecg.sendMessage(`${server}-obs-status`, {connected: true});

            getMediaSources();
            // obs.send("GetSourceSettings", {sourceName: "VLC Video Source"}).then((data) => {
            //     console.log("GetSourceSettings", data)
            // });
            // obs.send("GetSceneItemProperties", {item: "VLC Video Source"}).then((data) => {
            //     console.log("GetSceneItemProperties", data)
            // });
            // obs.send("SetMute", {source: "VLC Video Source", mute: true}).then((data) => {
            //     console.log("SetMute", data)
            // });
        }).catch((error) => {
            console.error(error);

            nodecg.sendMessage(`${server}-obs-status`, {connected: false});
        });

        e.preventDefault();
    };

    function getMediaSources() {
        if (obs._connected) {
            obs.send('GetSceneItemList', {sceneName: sceneName}).then((data) => {
                const mediaSources = [];
                const sceneItems = data.sceneItems;
                for (let id in sceneItems) {
                    const source = sceneItems[id];
                    if (source.sourceKind === "vlc_source") {
                        mediaSources.push(sceneItems[id]);
                    }
                }
                nodecg.sendMessage(`${server}-media-sources`, mediaSources);
                mediaSourcesReplicant.value = mediaSources;
            });
        }
    }

    function setMediaSource(sourceName, url) {
        return new Promise((reject, resolve) => {
            if (obs._connected && sourceName !== "undefined") {
                const video = {
                    "hidden": false,
                    "selected": false,
                    "value": url
                }
                obs.send("SetSourceSettings", {
                    sourceName: sourceName,
                    sourceSettings: {playlist: [video]},
                    sceneName: sceneName
                })
                    // .catch((error) => {
                    //     reject(error);
                    // })
                    .then((data) => {
                        resolve(data);
                    });
            } else {
                reject({connected: false});
            }
        });
    }

    function muteSource(source, mute) {
        return obs.send("SetMute", {source: source, mute: mute});
    }

    function swapMediaSource(source1, source2) {
        const source1sourceName = source1.sourceName;
        const source2sourceName = source2.sourceName;
        console.log(source1sourceName, source2sourceName);
        if (source1sourceName === source2sourceName) {
            return;
        }

        if (obs._connected) {
            const getSceneItemInfoPromises = [obs.send("GetSceneItemProperties", {"scene-name": sceneName, item: source1sourceName}), obs.send("GetSceneItemProperties", {"scene-name": sceneName, item: source2sourceName})];
            Promise.all(getSceneItemInfoPromises).then((data) => {
                const oldSource1Properties = data[0];
                const oldSource2Properties = data[1];

                console.log(data);

                const source1Width = oldSource1Properties.bounds.x;
                const source1Height = oldSource1Properties.bounds.y;

                const source2Width = oldSource2Properties.bounds.x;
                const source2Height = oldSource2Properties.bounds.y;

                const source1X = oldSource1Properties.position.x;
                const source1Y = oldSource1Properties.position.y;

                const source2X = oldSource2Properties.position.x;
                const source2Y = oldSource2Properties.position.y;

                const newSource1Properties = {
                    "scene-name": sceneName,
                    item: source1sourceName,
                    bounds: {
                        x: source2Width,
                        y: source2Height
                    },
                    position: {
                        x: source2X,
                        y: source2Y
                    }
                };
                const newSource2Properties = {
                    "scene-name": sceneName,
                    item: source2sourceName,
                    bounds: {
                        x: source1Width,
                        y: source1Height
                    },
                    position: {
                        x: source1X,
                        y: source1Y
                    }
                };

                console.log(source1.muteSettings);
                console.log(source2.muteSettings);

                console.log(newSource1Properties);
                console.log(newSource2Properties);

                const muteSourcePromises = []
                if (source1.muteSettings.change === true) {
                    muteSourcePromises.push(muteSource(source1sourceName, source1.muteSettings.value));
                }

                if (source2.muteSettings.change === true) {
                    muteSourcePromises.push(muteSource(source2sourceName, source2.muteSettings.value));
                }

                const sendSceneItemInfoPromises = [obs.send("SetSceneItemProperties", newSource1Properties), obs.send("SetSceneItemProperties", newSource2Properties)];
                Promise.all(sendSceneItemInfoPromises).then((data) => {
                    console.log(data);
                    nodecg.sendMessage(`${server}-swap-video-source-result`, {source1, source2});
                }).catch((error) => {
                    console.error(error);
                });

                Promise.all(muteSourcePromises).then((data) => {
                    console.log(data);
                }).catch((error) => {
                    console.error(error);
                })
            });
        }
    }

    disconnectButton.onclick = function (e) {
        obs.disconnect();
        disconnect();
        console.log(obs);

        e.preventDefault();
    }

    function disconnect() {
        OBSHost.disabled = false;
        OBSPassword.disabled = false;
        disconnectButton.style.display = "none";
        connectButton.style.display = "inline-block";
        nodecg.sendMessage(`${server}-obs-status`, {connected: false});
    }

    obs.on('ConnectionClosed', () => disconnect());

    // obs.on('ConnectionOpened', (data) => callback(data));
    // obs.on('AuthenticationSuccess', (data) => callback(data));
    // obs.on('AuthenticationFailure', (data) => callback(data));

    obs.on('error', err => {
        console.error('socket error:', err);
    });

});