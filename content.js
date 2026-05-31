(function () {
  "use strict";

  const SKIP_SEGMENTS = {
    "79zgVz568oY": [{ start: 92, end: 104 }],
    ZpBCVW2rHoA: [{ start: 208, end: 225 }],
    aQ5KXdq0MoA: [{ start: 154, end: 170 }],
    RMk_gxPQV28: [{ start: 131, end: 159 }],
    x9AF6Ka0VMY: [{ start: 159, end: 187 }],
    "8ajHoWjkV90": [{ start: 159, end: 187 }],
    gab_XSEkwB4: [
      { start: 249, end: 360 },
      { start: 629, end: 642 }
    ],
    OAuKJLarQ08: [{ start: 121, end: 150 }],
    "Y-yXXghHx-s": [{ start: 120, end: 149 }],
    "48XgscozT-A": [{ start: 88, end: 103 }]
  };

  const SEEK_PADDING_SECONDS = 0.15;
  let currentVideoId = null;
  let skippedKeys = new Set();
  let observedVideo = null;

  function getVideoId() {
    const url = new URL(window.location.href);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] || null;
    }

    return null;
  }

  function refreshVideoState() {
    const videoId = getVideoId();

    if (videoId !== currentVideoId) {
      currentVideoId = videoId;
      skippedKeys = new Set();
    }
  }

  function skipConfiguredSegment(video) {
    refreshVideoState();

    const segments = SKIP_SEGMENTS[currentVideoId];
    if (!segments || video.seeking || Number.isNaN(video.currentTime)) {
      return;
    }

    for (const segment of segments) {
      const key = `${currentVideoId}:${segment.start}-${segment.end}`;
      const isInsideSegment =
        video.currentTime >= segment.start &&
        video.currentTime < segment.end - SEEK_PADDING_SECONDS;

      if (isInsideSegment && !skippedKeys.has(key)) {
        skippedKeys.add(key);
        video.currentTime = segment.end + SEEK_PADDING_SECONDS;
        break;
      }

      if (video.currentTime < segment.start || video.currentTime >= segment.end) {
        skippedKeys.delete(key);
      }
    }
  }

  function attachToVideo() {
    const video = document.querySelector("video");

    if (!video || video === observedVideo) {
      return;
    }

    if (observedVideo) {
      observedVideo.removeEventListener("timeupdate", onTimeUpdate);
      observedVideo.removeEventListener("seeking", onTimeUpdate);
    }

    observedVideo = video;
    observedVideo.addEventListener("timeupdate", onTimeUpdate);
    observedVideo.addEventListener("seeking", onTimeUpdate);
    skipConfiguredSegment(observedVideo);
  }

  function onTimeUpdate(event) {
    skipConfiguredSegment(event.currentTarget);
  }

  const observer = new MutationObserver(attachToVideo);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener("yt-navigate-finish", () => {
    refreshVideoState();
    attachToVideo();
  });

  attachToVideo();
})();
