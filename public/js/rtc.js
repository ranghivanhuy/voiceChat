import h from './helpers.js';
window.addEventListener('load', () => {

    const room = h.getQString(location.href, 'room');
    console.log(room);
    const username = sessionStorage.getItem('username');

    if(room) {
        document.querySelector('body').setAttribute('class', 'background-room');
        document.querySelector('.create-room').setAttribute('hidden', true);
        document.querySelector('#main-container').attributes.removeNamedItem('hidden');
    }

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

    document.getElementById('btn-more').addEventListener('click', (e) => {
        e.preventDefault();
        var hidden = document.querySelector('#more-display').attributes.getNamedItem('hidden');
        if (hidden == null) {
            document.getElementById('more-display').setAttribute('hidden', true);
        } else {
            document.querySelector('#more-display').attributes.removeNamedItem('hidden');
        }
    })

    document.getElementById('toggle-chat-pane').addEventListener('click', (e) => {
        e.preventDefault();
        var hidden = document.querySelector('#chatbox').attributes.getNamedItem('hidden');
        if (hidden == null) {
            document.getElementById('chatbox').setAttribute('hidden', true);
        } else {
            document.querySelector('#chatbox').attributes.removeNamedItem('hidden');
        }
    })

    document.getElementById('close-chat').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#chatbox').setAttribute('hidden', true);
    });

    // Paste link other page
    document.getElementById('other-page').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#other-page-display').attributes.removeNamedItem('hidden');
    });

    document.getElementById('show-page').addEventListener('click', (e) => {
        e.preventDefault();
        let getURL = document.querySelector('#url-other').value;
        let newURL = getURL.replace("watch?v=", "embed/");
        document.getElementById('myIframe').src = newURL;
        document.querySelector('#show-iframe-other').attributes.removeNamedItem('hidden')
    });

    document.getElementById('hide-page').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#other-page-display').setAttribute('hidden', true);
    });

    document.getElementById('editor').addEventListener('click', () => {
        let getHtml = localStorage.getItem('output');
        document.getElementById('output').innerHTML = getHtml;
        document.querySelector('#editor-container').attributes.removeNamedItem('hidden')
        let output = document.getElementById('output');
        let buttons = document.getElementsByClassName('tool--btn');
        let buttonSave = document.getElementById('save');
        for (let btn of buttons) {
            btn.addEventListener('click', () => {
                let cmd = btn.dataset['command'];
                if (cmd === 'createlink') {
                    let url = prompt("Enter the link here: ", "http:\/\/");
                    document.execCommand(cmd, false, url);
                } else {
                    document.execCommand(cmd, false, null);
                }
            })
        }
        buttonSave.addEventListener('click', () => {
            let html = document.getElementById('output').innerHTML;
            localStorage.setItem('output', html);
            document.querySelector('#editor-container').setAttribute('hidden', true);
        })
    });

    $(document).click(function (event) {
        let $target = "";
        $target = $(event.target);
        if (!$target.closest('#btn-more').length &&
            $('#btn-more').is(":visible")) {
            hiddenMore();
        }
        // if (!$target.closest('#toggle-chat-pane').length &&
        //     $('#toggle-chat-pane').is(":visible")) {
        //     document.getElementById('chatbox').setAttribute('hidden', true);
        // }
    });

});