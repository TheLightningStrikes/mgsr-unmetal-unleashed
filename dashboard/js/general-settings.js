window.addEventListener('DOMContentLoaded', (event) => {
    const numberOfPlayers = document.getElementById("number-of-small-players");
    const OBSHost = document.getElementById("obs-host");
    const OBSPassword = document.getElementById("obs-password");
    const connectButton = document.getElementById("obs-connect-button");
    const disconnectButton = document.getElementById("obs-disconnect-button");

    const numberOfPlayersReplicant = nodecg.Replicant("number-of-players", {defaultValue: 0});
    const RTMPSmallPlayerReplicant = nodecg.Replicant("rtmp-data-small-player");
    const RTMPFeaturedPlayerReplicant = nodecg.Replicant("rtmp-data-featured-player");

    const mediaSourcesReplicant = nodecg.Replicant("obs-media-sources");

    const obs = new OBSWebSocket();

    const server = 'server';
    const web = 'web';

    const resolutions = {
        "featured-player": {
            "height": "1024",
            "width": "516"
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
            "x": "1330",
            "y": "38"
        },
        "small-player-3": {
            "x": "1100",
            "y": "422"
        },
        "small-player-4": {
            "x": "1330",
            "y": "422"
        },
        "small-player-5": {
            "x": "1100",
            "y": "598"
        },
        "small-player-6": {
            "x": "1330",
            "y": "598"
        },
    }

    const regions = {
        "NA": "rtmp",
        "EU": "eu-rtmp",
        "SGP": "sgp-rtmp",
        "OCE": "oce-rtmp"
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
            swapMediaSource(data.source1.sourceName, data.source2.sourceName);
        });

        NodeCG.waitForReplicants(numberOfPlayersReplicant, RTMPSmallPlayerReplicant, RTMPFeaturedPlayerReplicant).then(() => {
            numberOfPlayers.value = numberOfPlayersReplicant.value;

            RTMPSmallPlayerReplicant.on("change", (newValue) => {
                // set obs
                for (let id in newValue) {
                    setMediaSource(newValue[id].sourceName, getRTMPLink(newValue[id].rtmp.region, newValue[id].rtmp.key));
                }
            });

            RTMPFeaturedPlayerReplicant.on("change", (newValue) => {
                if (newValue !== undefined) {
                    setMediaSource(newValue.sourceName, getRTMPLink(newValue.rtmp.region, newValue.rtmp.key));
                }
            });

            nodecg.sendMessage(`${server}-obs-status`, {connected: false});
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
        }).catch((error) => {
            console.error(error);

            nodecg.sendMessage(`${server}-obs-status`, {connected: false});
        });

        e.preventDefault();
    };

    function getMediaSources() {
        if (obs._connected) {
            obs.send('GetMediaSourcesList').then((data) => {
                console.log(data)

                nodecg.sendMessage(`${server}-media-sources`, data);
                mediaSourcesReplicant.value = data;
            });
        }
    }

    function setMediaSource(sourceName, url) {
        if (obs._connected) {
            const video = {
                "hidden": false,
                "selected": false,
                "value": url
            }
            obs.send("SetSourceSettings", {
                sourceName: sourceName,
                sourceSettings: {playlist: [video]}
            }).then((data) => {
                //console.log(data);
            });
        }
    }

    function swapMediaSource(source1, source2) {
        console.log(source1, source2);
        if (source1 === source2) {
            return;
        }

        if (obs._connected) {
            const promises = [obs.send("GetSceneItemProperties", {item: source1}), obs.send("GetSceneItemProperties", {item: source2})];
            Promise.all(promises).then((data) => {
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
                    item: source1,
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
                    item: source2,
                    bounds: {
                        x: source1Width,
                        y: source1Height
                    },
                    position: {
                        x: source1X,
                        y: source1Y
                    }
                };

                console.log(newSource1Properties);
                console.log(newSource2Properties);

                obs.send("SetSceneItemProperties", newSource1Properties).then((data) => {
                    console.log("SetSceneItemProperties Source1", data);
                });
                obs.send("SetSceneItemProperties", newSource2Properties).then((data) => {
                    console.log("SetSceneItemProperties Source2", data);
                });
            });
        }
    }

    disconnectButton.onclick = function (e) {
        obs.disconnect();
        OBSHost.disabled = false;
        OBSPassword.disabled = false;
        disconnectButton.style.display = "none";
        connectButton.style.display = "inline-block";

        console.log(obs);
        nodecg.sendMessage(`${server}-obs-status`, {connected: false});

        e.preventDefault();
    }

    obs.on('ConnectionClosed', () => nodecg.sendMessage(`${server}-obs-status`, {connected: false}));

    // obs.on('ConnectionOpened', (data) => callback(data));
    // obs.on('AuthenticationSuccess', (data) => callback(data));
    // obs.on('AuthenticationFailure', (data) => callback(data));

    obs.on('error', err => {
        console.error('socket error:', err);
    });

});