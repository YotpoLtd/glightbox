/**
 * Set slide video
 *
 * @param {node} slide
 * @param {object} data
 * @param {int} index
 * @param {function} callback
 */
import { has, closest, injectAssets, addClass, removeClass, createHTML, isFunction, waitUntil } from '../utils/helpers.js';

export default function slideVideo(slide, data, index, callback) {
    const slideContainer = slide.querySelector('.ginner-container');
    const videoID = 'gvideo' + index;
    const slideMedia = slide.querySelector('.gslide-media');
    const videoPlayers = this.getAllPlayers();

    addClass(slideContainer, 'gvideo-container');

    slideMedia.insertBefore(createHTML('<div class="gvideo-wrapper"></div>'), slideMedia.firstChild);

    const videoWrapper = slide.querySelector('.gvideo-wrapper');

    injectAssets(this.settings.plyr.css, 'Plyr');

    let url = data.href;
    let provider = data?.videoProvider;
    let customPlaceholder = false;

    slideMedia.style.maxWidth = data.width;

    injectAssets(this.settings.plyr.js, 'Plyr', () => {
        // Set vimeo videos
        if (!provider && url.match(/vimeo\.com\/([0-9]*)/)) {
            provider = 'vimeo';
        }

        // Set youtube videos
        if (
            !provider &&
            (url.match(/(youtube\.com|youtube-nocookie\.com)\/watch\?v=([a-zA-Z0-9\-_]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9\-_]+)/) || url.match(/(youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9\-_]+)/))
        ) {
            provider = 'youtube';
        }

        // TODO if url include 'kaltura', the provider should be kaltura
        // Set kaltura videos
        if (!provider && url.match(/kaltura/)) {
            provider = 'kaltura';
        }

        // Set local videos
        // if no provider, default to local
        if (provider === 'local' || !provider) {
            provider = 'local';
            let html = '<video id="' + videoID + '" ';
            html += `style="background:#000; max-width: ${data.width};" `;
            html += 'preload="metadata" ';
            html += 'x-webkit-airplay="allow" ';
            html += 'playsinline ';
            html += 'controls ';
            html += 'class="gvideo-local">';
            html += `<source src="${url}">`;
            html += '</video>';
            customPlaceholder = createHTML(html);
        }

        let placeholder;
        if (provider === 'kaltura') {
            const playerContainerId = 'kaltura_player_573480599';
            customPlaceholder = createHTML(`<div id="${playerContainerId}" class="gvideo-local" style="background:#000; max-width: ${data.width}; height: ${data.height || '640px'}" data-plyr-provider="${provider}" data-plyr-embed-id="${url}"></div>`);
        }

        // prettier-ignore
        placeholder = customPlaceholder ? customPlaceholder : createHTML(`<div id="${videoID}" data-plyr-provider="${provider}" data-plyr-embed-id="${url}"></div>`);

        addClass(videoWrapper, `${provider}-video gvideo`);
        videoWrapper.appendChild(placeholder);
        videoWrapper.setAttribute('data-id', videoID);
        videoWrapper.setAttribute('data-index', index);

        if (provider === 'kaltura') {
            playKalturaVideo();
            callback();
        } else {
            const playerConfig = has(this.settings.plyr, 'config') ? this.settings.plyr.config : {};
            const player = new Plyr('#' + videoID, playerConfig);

            player.on('ready', (event) => {
                videoPlayers[videoID] = event.detail.plyr;
                if (isFunction(callback)) {
                    callback();
                }
            });
            player.on('enterfullscreen', handleMediaFullScreen);
            player.on('exitfullscreen', handleMediaFullScreen);
        }
        waitUntil(
            () => {
                return slide.querySelector('iframe') && slide.querySelector('iframe').dataset.ready == 'true';
            },
            () => {
                this.resize(slide);
            }
        );
    });
}

/**
 * Handle fullscreen
 *
 * @param {object} event
 */
function handleMediaFullScreen(event) {
    const media = closest(event.target, '.gslide-media');

    if (event.type === 'enterfullscreen') {
        addClass(media, 'fullscreen');
    }
    if (event.type === 'exitfullscreen') {
        removeClass(media, 'fullscreen');
    }
}

function playKalturaVideo() {
    const playerContainerId = 'kaltura_player_573480599';
    try {
        const kalturaPlayer = KalturaPlayer.setup({
            targetId: playerContainerId,
            provider: {
                partnerId: 4661612,
                uiConfId: 50273112,
            },
        });
        kalturaPlayer.loadMedia({ entryId: '1_qazfolmk' });
    } catch (e) {
        console.error('Error loading Kaltura Player:', e.message);
    }
}
