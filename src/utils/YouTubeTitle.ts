// Modified from web-scrobbler: https://github.com/web-scrobbler/web-scrobbler/blob/26b0a4f388799b1eeb1dfe1e21c747f3496ea53e/src/core/content/util.js#L561
import MetadataFilter = require('metadata-filter');

type ArtistTrack = {
  artist: string | null;
  track: string | null;
}

type ArtistTrackResponse = {
  artist: string | null;
  track: string;
}

const separators = [
  ' -- ', '--', ' ~ ', ' - ', ' – ', ' — ',
  ' // ', '-', ':', '|', '///', '/',
];

const ytTitleRegExps = [
  // Artist "Track", Artist: "Track", Artist - "Track", etc.
  {
    pattern: /(.+?)([\s:—-])+\s*"(.+?)"/,
    groups: { artist: 1, track: 3 },
  },
  // Artist「Track」 (Japanese tracks)
  {
    pattern: /(.+?)「(.+?)」/,
    groups: { artist: 1, track: 2 },
  },
  // Track (... by Artist)
  {
    pattern: /(\w[\s\w]*?)\s+\([^)]*\s*by\s*([^)]+)+\)/,
    groups: { artist: 2, track: 1 },
  },
];

const isArtistTrackEmpty = (artistTrack: ArtistTrack) => {
  return !(artistTrack && artistTrack.artist && artistTrack.track);
};

export const processYtVideoTitle = (videoTitle: string): ArtistTrackResponse => {
  let artist = null;
  let track = null;

  // Remove [genre] or 【genre】 from the beginning of the title
  let title = videoTitle.replace(/^((\[[^\]]+])|(【[^】]+】))\s*-*\s*/i, '');

  // Remove track (CD and vinyl) numbers from the beginning of the title
  title = title.replace(/^\s*([a-zA-Z]{1,2}|[0-9]{1,2})[1-9]?\.\s+/i, '');

  // Try to match one of the regexps
  for (const regExp of ytTitleRegExps) {
    const artistTrack = title.match(regExp.pattern);
    if (artistTrack) {
      artist = artistTrack[regExp.groups.artist];
      track = artistTrack[regExp.groups.track];
      break;
    }
  }

  // No match? Try splitting, then.
  if (isArtistTrackEmpty({ artist, track })) {
    for(let separator of separators) {
      if(videoTitle.indexOf(separator) > -1) {
        ([ artist, track ] = videoTitle.split(separator));
      }
    }
  }

  if(!track) {
    track = videoTitle
  }

  const filter = MetadataFilter.getYoutubeFilter().append({track: MetadataFilter.decodeHtmlEntities});

  if(artist) {
    artist = filter.filterField('track', artist);
  }
  track = filter.filterField('track', track);

  return { artist, track };
};
