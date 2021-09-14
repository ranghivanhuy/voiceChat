import h from './helpers.js';
window.addEventListener('load', () => {

    var screen = '';

    document.getElementById('microphone').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#microphone').setAttribute('hidden', true);
        document.querySelector('#mute-microphone').attributes.removeNamedItem('hidden');
    });

    document.getElementById('mute-microphone').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#mute-microphone').setAttribute('hidden', true);
        document.querySelector('#microphone').attributes.removeNamedItem('hidden');
    });
    function shareScreen() {
        h.shareScreen().then((stream) => {
            // h.toggleShareIcons(true);

            //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
            //It will be enabled was user stopped sharing screen
            // h.toggleVideoBtnDisabled(true);

            //save my screen stream
            screen = stream;

            //share the new stream with all partners
            // broadcastNewTracks(stream, 'video', false);

            //When the stop sharing button shown by the browser is clicked
            screen.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharingScreen();
            });
        }).catch((e) => {
            console.error(e);
        });
    }

    function stopSharingScreen() {
        //enable video toggle btn
        // h.toggleVideoBtnDisabled(false);

        return new Promise((res, rej) => {
            screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

            res();
        }).then(() => {
            // h.toggleShareIcons(false);
            // broadcastNewTracks(myStream, 'video');
        }).catch((e) => {
            console.error(e);
        });
    }
    function hiddenMore() {
        document.getElementById('more-display').setAttribute('hidden', true);
    }

    //When user clicks the 'Share screen' button
    document.getElementById('share-screen').addEventListener('click', (e) => {
        e.preventDefault();
        hiddenMore();
        if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
            stopSharingScreen();
        }

        else {
            shareScreen();
        }
    });

    document.getElementById('watch-youtube').addEventListener('click', (e) => {
        e.preventDefault();
        hiddenMore();
        document.querySelector('#video-youtube').attributes.removeNamedItem('hidden');
    });

    document.getElementById('show-video').addEventListener('click', (e) => {
        e.preventDefault();
        let getURL = document.querySelector('#url').value;

        let newURL = getURL.replace("watch?v=", "embed/");
        let link = getURL.search('youtube.com');
        if (link == -1) {
            alert('You can paste link youtube');
        } else {
            document.getElementById('iframe').src = newURL;
            document.querySelector('#show-iframe').attributes.removeNamedItem('hidden')
        }
    });

    document.getElementById('hide-video').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#video-youtube').setAttribute('hidden', true);
    });

});