/**
 * Set slide video
 *
 * @param {node} slide
 * @param {object} data
 * @param {int} index
 * @param {function} callback
 */
import { has, closest, injectAssets, addClass, removeClass, createHTML, isFunction, waitUntil } from '../utils/helpers.js';

const KALTURA_DEFAULT_PARTNER_ID = 4661612;
const KALTURA_DEFAULT_PLAYER_ID = 50273112;

export default function slideVideo(slide, data, index, callback) {
    const slideContainer = slide.querySelector('.ginner-container');
    const videoID = 'gvideo' + index;
    const slideMedia = slide.querySelector('.gslide-media');
    const videoPlayers = this.getAllPlayers();

    addClass(slideContainer, 'gvideo-container');

    slideMedia.insertBefore(createHTML('<div class="gvideo-wrapper"></div>'), slideMedia.firstChild);

    const videoWrapper = slide.querySelector('.gvideo-wrapper');

    let url = data.href;
    let provider = data?.videoProvider;
    let customPlaceholder = false;

    slideMedia.style.maxWidth = data.width;

    if (url.match(/kaltura/)) {
        launchKalturaPlayer(videoWrapper, videoID, index, data, url);
        callback()
        return;
    }

    // Default player is Plyr
    injectAssets(this.settings.plyr.css, 'Plyr');
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

        // prettier-ignore
        const placeholder = customPlaceholder ? customPlaceholder : createHTML(`<div id="${videoID}" data-plyr-provider="${provider}" data-plyr-embed-id="${url}"></div>`);

        addClass(videoWrapper, `${provider}-video gvideo`);
        videoWrapper.appendChild(placeholder);
        videoWrapper.setAttribute('data-id', videoID);
        videoWrapper.setAttribute('data-index', index);

        const playerConfig = has(this.settings.plyr, 'config') ? this.settings.plyr.config : {};
        const player = new Plyr('#' + videoID, playerConfig);

        player.on('ready', (event) => {
            videoPlayers[videoID] = event.detail.plyr;
            if (isFunction(callback)) {
                callback();
            }
        });
        waitUntil(
            () => {
                return slide.querySelector('iframe') && slide.querySelector('iframe').dataset.ready == 'true';
            },
            () => {
                this.resize(slide);
            }
        );
        player.on('enterfullscreen', handleMediaFullScreen);
        player.on('exitfullscreen', handleMediaFullScreen);
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

function launchKalturaPlayer(videoWrapper, videoID, index, data, url) {
    const playerContainerId = `kaltura_player_${videoID}`;
    const entryId = extractKalturaEntryId(url);
    const kalturaData = data?.kaltura || {};
    prepareKalturaPlayer(videoWrapper, videoID, playerContainerId, index, data);
    playKalturaVideo(playerContainerId, entryId, kalturaData?.partnerId, kalturaData?.playerId);
}

function extractKalturaEntryId(url) {
    const pattern = /entryId\/([^\/]+)/;
    const matches = url.match(pattern);
    return matches ? matches[1] : null;
}

function prepareKalturaPlayer(videoWrapper, videoID, playerContainerId, index, data) {
    const provider = 'kaltura'
    const element = createHTML(`<div id="${playerContainerId}" class="gvideo-local" style="background:#000; max-width: ${data.width}; height: ${data.height || '640px'}"></div>`);
    addClass(videoWrapper, `${provider}-video gvideo`);
    videoWrapper.appendChild(element);
    videoWrapper.setAttribute('data-id', videoID);
    videoWrapper.setAttribute('data-index', index);
}

function playKalturaVideo(playerContainerId, entryId, partnerId, playerId) {
    try {
        const kalturaPlayer = KalturaPlayer.setup({
            targetId: playerContainerId,
            provider: {
                partnerId: partnerId || KALTURA_DEFAULT_PARTNER_ID,
                uiConfId: playerId || KALTURA_DEFAULT_PLAYER_ID,
            },
            playback: {
                autoplay: true,
                muted: true
            }
        });
        kalturaPlayer.loadMedia({ entryId: entryId }).then(() => {
            console.log('Kaltura Player loaded');
            const playButton = document.querySelector('.playkit-volume-control');
            if (playButton) {
                playButton.addEventListener('click', () => {
                    console.log('playkit-volume-control clicked');
                });
            } else {
                console.log('Play button not found. It might not be loaded yet, or the class name has changed.');
            }
        });
    } catch (e) {
        console.error('Error loading Kaltura Player:', e.message);
    }
}
