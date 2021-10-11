"use strict";
module.exports = function (nodecg) {
    const server = 'server';
    const web = 'web';

    nodecg.listenFor(`${server}-obs-status`, (data) => {
        nodecg.sendMessage(`${web}-obs-status`, data);
    });

    nodecg.listenFor(`${server}-number-of-players`, (data) => {
        nodecg.sendMessage(`${web}-number-of-players`, data);
    });

    nodecg.listenFor(`${server}-swap-video-source`, (data) => {
        nodecg.sendMessage(`${web}-swap-video-source`, data);
    });

    nodecg.listenFor(`${server}-media-sources`, (data) => {
        nodecg.sendMessage(`${web}-media-sources`, data);
    });

    nodecg.listenFor(`${server}-swap-video-source-result`, (data) => {
        nodecg.sendMessage(`${web}-swap-video-source-result`, data);
    });

    nodecg.listenFor(`${server}-rtmp-small-player`, (data) => {
        nodecg.sendMessage(`${web}-rtmp-small-player`, data);
    });

    nodecg.listenFor(`${server}-rtmp-featured-player`, (data) => {
        nodecg.sendMessage(`${web}-rtmp-featured-player`, data);
    });
}