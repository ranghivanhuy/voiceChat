window.addEventListener('load', () => {

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

});