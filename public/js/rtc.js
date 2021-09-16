import h from './helpers.js';
window.addEventListener('load', () => {
    h.toggleModal('recording-options-modal', false);
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!room) {
        document.querySelector('.move').setAttribute('hidden', 'true');
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    } else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
        document.querySelector('.move').setAttribute('hidden', 'true');
    } else {
        document.querySelector('body').setAttribute('class', 'background-room');
        document.querySelector('#main-container').attributes.removeNamedItem('hidden');

        var pc = [];

        let socket = io('/stream');
        var socketId = '';
        var randomNumber = `__${h.generateRandomString()}`;
        var myStream = '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';

        //Get user video by default
        getAndSetUserStream();

        socket.on('connect', () => {
            //set socketId
            socketId = socket.io.engine.id;


            socket.emit('subscribe', {
                room: room,
                socketId: socketId
            });


            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });


            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });


            socket.on('ice candidates', async (data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserFullMedia().then(async (stream) => {
                        if (!document.getElementById('local').srcObject) {
                            h.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();

                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                    }).catch((e) => {
                        console.error(e);
                    });
                }

                else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });

            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });

        });

        function getAndSetUserStream() {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                myStream = stream;

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }

        function broadcastNewTracks(stream, type, mirrorMode = true) {
            h.setLocalStream(stream, mirrorMode);

            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for (let p in pc) {
                let pName = pc[p];

                if (typeof pc[pName] == 'object') {
                    h.replaceTrack(track, pc[pName]);
                }
            }
        }


        function sendMsg(msg) {
            let regetUsername = sessionStorage.getItem('username');
            let data = {
                room: room,
                msg: msg,
                sender: `${regetUsername} (${randomNumber})`
            };

            //emit chat message
            socket.emit('chat', data);

            //add localchat
            h.addChat(data, 'local');
        }



        function init(createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());

            if (screen && screen.getTracks().length) {
                screen.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
                });
            }

            else if (myStream) {
                myStream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
                });
            }

            else {
                h.getUserFullMedia().then((stream) => {
                    //save my stream
                    myStream = stream;

                    stream.getTracks().forEach((track) => {
                        pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                    });

                    h.setLocalStream(stream);
                }).catch((e) => {
                    console.error(`stream error: ${e}`);
                });
            }



            //create offer
            if (createOffer) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();

                    await pc[partnerName].setLocalDescription(offer);

                    socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
                };
            }



            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({ candidate }) => {
                socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
            };



            //add
            pc[partnerName].ontrack = (e) => {
                let str = e.streams[0];
                if (document.getElementById(`${partnerName}-video`)) {
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                }

                else {
                    //video elem
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.className = 'remote-video';

                    //video controls elements
                    let controlDiv = document.createElement('div');
                    controlDiv.className = 'remote-video-controls';
                    controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                        <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                    //create a new div for card
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-sm';
                    cardDiv.id = partnerName;
                    cardDiv.appendChild(newVid);
                    cardDiv.appendChild(controlDiv);

                    //put div in main-section elem
                    document.getElementById('videos').appendChild(cardDiv);

                    h.adjustVideoElemSize();
                }
            };

            pc[partnerName].onconnectionstatechange = (d) => {
                switch (pc[partnerName].iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        h.closeVideo(partnerName);
                        break;

                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                }
            };

            pc[partnerName].onsignalingstatechange = (d) => {
                switch (pc[partnerName].signalingState) {
                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                }
            };
        }

        var screen = '';

        document.getElementById('microphone').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#microphone').setAttribute('hidden', true);
            document.querySelector('#mute-microphone').attributes.removeNamedItem('hidden');
            myStream.getAudioTracks()[0].enabled = true;
            broadcastNewTracks(myStream, 'audio');
        });

        document.getElementById('mute-microphone').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#mute-microphone').setAttribute('hidden', true);
            document.querySelector('#microphone').attributes.removeNamedItem('hidden');
            myStream.getAudioTracks()[0].enabled = false;
            broadcastNewTracks(myStream, 'audio');
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
        function startRecording(stream) {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorder.start(1000);
            toggleRecordingIcons(true);

            mediaRecorder.ondataavailable = function (e) {
                recordedStream.push(e.data);
            };

            mediaRecorder.onstop = function () {
                toggleRecordingIcons(false);

                h.saveRecordedStream(recordedStream, username);

                setTimeout(() => {
                    recordedStream = [];
                }, 3000);
            };

            mediaRecorder.onerror = function (e) {
                console.error(e);
            };
        }

        function toggleRecordingIcons(isRecording) {
            let e = document.getElementById('record');

            if (isRecording) {
                e.setAttribute('title', 'Stop recording');
                e.children[0].classList.add('text-danger');
                e.children[0].classList.remove('text-white');
            }

            else {
                e.setAttribute('title', 'Record');
                e.children[0].classList.add('text-white');
                e.children[0].classList.remove('text-danger');
            }
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

        document.getElementById('change-user').addEventListener('click', (e) => {
            e.preventDefault();
            let userName = sessionStorage.getItem('username');
            document.getElementById('change').value = userName;
            document.querySelector('#myModal').attributes.removeNamedItem('hidden')
        });

        document.getElementById('save_name').addEventListener('click', (e) => {
            e.preventDefault();
            let userName = document.getElementById('change').value;
            sessionStorage.setItem('username', userName);
            document.querySelector('#myModal').setAttribute('hidden', true);
        });

        document.getElementById('record').addEventListener('click', (e) => {
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */

            if (!mediaRecorder || mediaRecorder.state == 'inactive') {
                h.toggleModal('recording-options-modal', true);
            }

            else if (mediaRecorder.state == 'paused') {
                mediaRecorder.resume();
            }

            else if (mediaRecorder.state == 'recording') {
                mediaRecorder.stop();
            }
        });
        document.getElementById('record-screen').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (screen && screen.getVideoTracks().length) {
                startRecording(screen);
            }

            else {
                h.shareScreen().then((screenStream) => {
                    startRecording(screenStream);
                }).catch(() => { });
            }
        });

        //When user choose to record own video
        document.getElementById('record-video').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (myStream && myStream.getTracks().length) {
                startRecording(myStream);
            }

            else {
                h.getUserFullMedia().then((videoStream) => {
                    startRecording(videoStream);
                }).catch(() => { });
            }
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);
        })


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

    }
});