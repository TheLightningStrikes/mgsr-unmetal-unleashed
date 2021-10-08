window.addEventListener('DOMContentLoaded', (event) => {
    let test = document.getElementById("twitch-stream-link-featured");

    function logSubmit(event) {
        test = document.getElementById("twitch-stream-link-featured");
        event.preventDefault();
    }

    const form = document.getElementById('featured-form');
    form.addEventListener('submit', logSubmit);

});