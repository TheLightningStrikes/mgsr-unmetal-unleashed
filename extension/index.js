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

    nodecg.listenFor(`${server}-swap-video-animation`, (data) => {
        nodecg.sendMessage(`${web}-swap-video-animation`, data);
    });

    nodecg.listenFor(`${server}-media-sources`, (data) => {
        nodecg.sendMessage(`${web}-media-sources`, data);
    });

    nodecg.listenFor(`${server}-swap-video-source-result`, (data) => {
        nodecg.sendMessage(`${web}-swap-video-source-result`, data);
    });

    nodecg.listenFor(`${server}-rtmp-change`, (data) => {
        nodecg.sendMessage(`${web}-rtmp-change`, data);
    });

    nodecg.listenFor(`${server}-rtmp-change-result`, (data) => {
        nodecg.sendMessage(`${web}-rtmp-change-result`, data);
    });

    nodecg.listenFor(`${server}-statistics-update`, (data) => {
        nodecg.sendMessage(`${web}-statistics-update`, data);
    });

    nodecg.listenFor(`${server}-small-settings-update`, (data) => {
        nodecg.sendMessage(`${web}-small-settings-update`, data);
    });

    nodecg.listenFor(`${server}-featured-settings-update`, (data) => {
        nodecg.sendMessage(`${web}-featured-settings-update`, data);
    });
}