// Livestream panel (TBPN)

const DEFAULT_LIVESTREAM = 'https://www.youtube.com/watch?v=jWEZa9WEnIo';

function extractYouTubeId(url) {
    if (!url) return null;

    // Standard watch URL
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (watchMatch) return watchMatch[1];

    // Embed URL
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&\s]+)/);
    if (embedMatch) return embedMatch[1];

    // Live URL
    const liveMatch = url.match(/youtube\.com\/live\/([^?&\s]+)/);
    if (liveMatch) return liveMatch[1];

    return null;
}

function getLivestreamEmbedUrl() {
    const savedUrl = getLivestreamUrl() || DEFAULT_LIVESTREAM;
    const videoId = extractYouTubeId(savedUrl);

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }

    return savedUrl;
}

function updateLivestreamEmbed() {
    const iframe = document.getElementById('tbpnEmbed');
    if (iframe) {
        iframe.src = getLivestreamEmbedUrl();
    }
}

function openLivestreamSettings() {
    const currentUrl = getLivestreamUrl() || DEFAULT_LIVESTREAM;
    const newUrl = prompt('Enter YouTube livestream URL:', currentUrl);

    if (newUrl !== null && newUrl.trim()) {
        saveLivestreamUrl(newUrl.trim());
        updateLivestreamEmbed();
    }
}
