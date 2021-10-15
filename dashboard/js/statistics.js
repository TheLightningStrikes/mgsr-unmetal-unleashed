window.addEventListener('DOMContentLoaded', (event) => {
    const statisticsReplicant = nodecg.Replicant("statistics");

    let recordHolder = document.getElementById("record-holder");
    let recordTime = document.getElementById("record-time");

    const server = 'server';
    const web = 'web';

    initializeValues();

    function initializeValues() {
        NodeCG.waitForReplicants(statisticsReplicant).then(() => {
            if (statisticsReplicant.value !== undefined) {
                recordHolder.value = statisticsReplicant.value.recordHolder;
                recordTime.value = statisticsReplicant.value.recordTime;
            }
        });

        document.getElementById("statistics-submit").onclick = function (e) {
            console.log("submitted");
            const statistics = {recordHolder: recordHolder.value, recordTime: recordTime.value};
            nodecg.sendMessage(`${server}-statistics-update`, statistics);
            statisticsReplicant.value = statistics;

            e.preventDefault();
        }
    }
});