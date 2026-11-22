import { initRoboticStompbox } from './features/robotic-stompbox/script.js?v=c8c9db15b571';

// Homepage features are initialized here, inside the same document.
initRoboticStompbox(document.querySelector('[data-robotic-stompbox]'));

// Keep still-image cuts centered; give the recorded equipment scroll a left focus.
document.querySelectorAll('video[data-left-align-after]').forEach(video => {
  const switchTime = Number(video.dataset.leftAlignAfter);
  if (!Number.isFinite(switchTime) || switchTime < 0) return;

  let previousPosition;
  const updateFraming = time => {
    const position = time >= switchTime ? 'left center' : 'center center';
    if (position === previousPosition) return;
    video.style.setProperty('--thumbnail-position', position);
    previousPosition = position;
  };
  const updateFromPlayback = () => updateFraming(video.currentTime);
  ['loadedmetadata', 'seeking', 'seeked', 'emptied'].forEach(event => {
    video.addEventListener(event, updateFromPlayback);
  });
  if (typeof video.requestVideoFrameCallback === 'function') {
    const followFrame = (_now, frame) => {
      updateFraming(frame.mediaTime);
      video.requestVideoFrameCallback(followFrame);
    };
    video.requestVideoFrameCallback(followFrame);
  } else {
    video.addEventListener('timeupdate', updateFromPlayback);
  }
  updateFromPlayback();
});

