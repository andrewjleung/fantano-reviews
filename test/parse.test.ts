import { Right } from 'purify-ts';
import { describe, expect, it } from 'vitest';
import parse from '../src/parse';
import { Review, Video } from '../src/types';

const newReviewWithImmediateHyphen: Video = {
  publishedAt: '2012-10-22T14:27:09Z',
  title: 'Kendrick Lamar- good kid, m.A.A.d. city ALBUM REVIEW',
  description:
    'Listen: http://theneedledrop.com/2012/09/kendrick-lamar-art-of-peer-pressure-loved/\n\nWith good kid, m.A.A.d. city, Compton rapper Kendrick Lamar drops what\'s easily hip hop\'s most cinematic album of 2012.\n\nWhat did you think of this album? Love it? Hate it? Why? What should I review next, eh?\n\nhttp://theneedledrop.com\nhttp://twitter.com/theneedledrop\nhttp://facebook.com/theneedledrop\nhttp://theneedledrop.com/support\nhttp://theneedledrop.com/category/podcast/\nhttp://theneedledrop.com/forum\n\nFAV TRACKS: BACKSEAT FREESTYLE, MONEY TREES, POETIC JUSTICE, GOOD KID, M.A.A.D. CITY, SWIMMING POOLS (DRANK), SING ABOUT ME / I\'M DYING OF THIRST, COMPTON\n\nLEAST FAV TRACK: REAL (IF I HAD TO PICK ONE)\n\nKENDRICK LAMAR- GOOD KID, M.A.A.D. CITY / 2012 / INTERSCOPE / WEST COAST HIP HOP, CONSCIOUS HIP HOP\n\n9/10 http://www.theneedledrop.com/loved-list/2012\n\nY\'all know this is just my opinion, right?\n\nTags:\n\nkendrick lamar, good kid, m.a.a.d. city, swimming pools, album review music reviews indie underground new latest lyrics "full song" listen track concert live performance update "the needle drop" "anthony fantano" vlog talk discussion "music nerd", compton, real, sing about me, poetic justice, money trees, drake, jay rock, dr. dre, eiht, dant kill my vibe, section.80, west coast, california, compton',
};

const newReviewWithSpacedHyphen: Video = {
  publishedAt: '2022-05-17T04:59:34Z',
  title: 'Kendrick Lamar - Mr. Morale & The Big Steppers ALBUM REVIEW',
  description:
    "Listen: https://www.youtube.com/watch?v=zI383uEwA6Q\n\nKenny's big step.\n\nMore rap reviews: https://www.youtube.com/playlist?list=PLP4CSgl7K7ormBIO138tYonB949PHnNcP\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nFAV TRACKS: UNITED IN GRIEF, N95, WORLDWIDE STEPPERS, FATHER TIME, RICH, RICH SPIRIT, WE CRY TOGETHER, SILENT HILL, SAVIOR, AUNTIE DIARIES, MR. MORALE, MOTHER I SOBER\n\nLEAST FAV TRACK: CROWN\n\nKENDRICK LAMAR - MR. MORALE & THE BIG STEPPERS / 2022 / TDE / PGLANG\n\n8/10 https://www.theneedledrop.com/loved-list/2022\n\nY'all know this is just my opinion, right?",
};

const oldReview: Video = {
  publishedAt: '2010-03-03T03:25:15Z',
  title: 'Gorillaz- Plastic Beach Review',
  description:
    "7/10 http://bit.ly/9k9Chc\r\n\r\nGorillaz latest LP is as dynamic as their previous efforts, but much more conceptual and cohesive. This thing leafs through hip hop, new wave, soul, and trip hop without batting an eye; plus, there's a ton of fantastic guest collaborators: Snoop Dogg, Mick Jones, Lou Reed, and De La Soul to name a few! There were a few bumps along the way, but this thing is a journey from beginning to end. There are some real 10/10s along the way, and I wouldn't hesitate to recommend this to any pop fan. \r\n\r\nHow do YOU feel about this LP? Did you dig it? Hate it? Why?\r\n\r\nhttp://theneedledrop.com\r\n\r\nSupport TND: http://bit.ly/2ss0ND\r\n\r\nOur podcast: http://bit.ly/a5jiED\r\n\r\nhttp://twitter.com/theneedledrop",
};

const edgeCaseReview: Video = {
  publishedAt: '2013-06-05T14:56:57Z',
  title: 'CX KiDTRONiK: KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF ALBUM REVIEW',
  description:
    "Listen: http://theneedledrop.com/2013/05/cx-kidtronik-lets-go-krazy-ft-atari-teenage-riot/\n\nExperimental hip hop and electronic music producer CX KiDTRONiK's KRACK ATTACK 2 will probably be one of the noisiest and most high-octane experiences you'll have with music this year--even if it is a bit messy and inconsistent.\n\nWhat did you think of this album? Love it? Hate it? Why? What should I review next, eh?\n\nFollow TND on Twitter: http://twitter.com/theneedledrop\n\nLike TND on Facebook: http://facebook.com/theneedledrop\n\nSupport TND: http://theneedledrop.com/support\n\nOur podcast: http://theneedledrop.com/category/podcast/\n\nJoin our forum: http://theneedledrop.com/forum\n\nhttp://theneedledrop.com\n\nFAV TRACKS: KRAK ATTACK WAR ZONE, LOCKED IN FT. BILLY DANZE, BLACKOUT (OTTO VON SCHIRACH MIX) FT. PHIL THE AGONY, RICKY RAY, AND MED, LET'S GO KRAZY (ATARI TEENAGE RIOT MIX) FT. NIC ENDO & ALEC EMPIRE), MENACE TO SOCIETY FT. CREAM, BASEK, AND MONTANA BLAQ\n\nLEAST FAV TRACK: YOU'RE A DUMMY\n\nCX KIDTRONIK - KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF / 2013 / STONES THROW / EXPERIMENTAL HIP HOP, INDUSTRIAL HIP HOP, DIGITAL HARDCORE, DRUM MACHINE METAL THAT RIPS YOUR FACE OFF\n\n6/10\n\nY'all know this is just my opinion, right?",
};

const classicReview: Video = {
  publishedAt: '2022-01-08T18:52:54Z',
  title: 'Cocteau Twins - Heaven or Las Vegas ALBUM REVIEW',
  description:
    "Listen: https://www.youtube.com/watch?v=PbbUeLkZt74&list=OLAK5uy_lxPYZGdCg185g6T9C1O--IoeLy1nvDT80\n\nClassics Week 2022 closes with Heaven or Las Vegas, Cocteau Twins' final 4AD album and one of dream pop's most iconic statements.\n\nMore classic reviews: https://www.youtube.com/playlist?list=PLP4CSgl7K7or_7JI7RsEsptyS4wfLFGIN\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nCOCTEAU TWINS - HEAVEN OR LAS VEGAS / 1990 / 4AD / DREAM POP\n\nCLASSIC/10\n\nY'all know this is just my opinion, right?",
};

const notGoodReview1: Video = {
  publishedAt: '2020-09-29T19:43:33Z',
  title: "Machine Gun Kelly's Tickets to My Downfall: NOT GOOD",
  description:
    "Listen: https://youtu.be/D56V01lqnNQ\n\n:/\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nMACHINE GUN KELLY - TICKETS TO MY DOWNFALL / 2020 / BAD BOY / POP PUNK, EMO POP\n\nNOT GOOD/10\n\nY'all know this is just my opinion, right?",
};

const notGoodReview2: Video = {
  publishedAt: '2022-09-13T03:55:11Z',
  title: 'NAV - Demons Protected by Angels ALBUM REVIEW',
  description:
    "Listen: https://www.youtube.com/watch?v=cddZavNmbEI\n\nWhen the world needed NAV the most, he returned.\n\nMore rap reviews: https://www.youtube.com/playlist?list=PLP4CSgl7K7ormBIO138tYonB949PHnNcP\n\n[script blame: austen w/ novel & infer]\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nFAV TRACKS: EFFED UP\n\nLEAST FAV TRACK: MISMATCH\n\nNAV - DEMONS PROTECTED BY ANGELS / 2022 / XO / TRAP RAP\n\n4/✨\n\nY'all know this is just my opinion, right?",
};

const notGoodReview3: Video = {
  publishedAt: '2022-07-25T21:27:33Z',
  title: 'Imagine Dragons - Mercury Acts 1 & 2 ALBUM REVIEW',
  description:
    'Listen: https://www.youtube.com/watch?v=Te3_VlimRw0\n\nA totally normal Imagine Dragons review.\n\nThanks kingcon2k11 for letting the bot do this one: https://www.instagram.com/kingcon2k11/\nAssistance: @_dyl.jpg_\n"Better Than Mercury" playlist: https://open.spotify.com/playlist/59s4NfZFpL2Pc0p4W4B8Su\nA2B2: https://www.a2b2.org/\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nIMAGINE DRAGONS - MERCURY ACTS 1 & 2 / 2022 / INTERSCOPE / POP ROCK\n\nNOT GREAT/10\n\nY\'all know this is just the bot\'s opinion, right?',
};

const notGoodReview4: Video = {
  publishedAt: '2022-01-25T02:44:53Z',
  title: "Walker Hayes' Country Stuff The Album: NOT BAD",
  description:
    "Listen: https://www.youtube.com/watch?v=hp6T14iP2C4\n\nY'know, sometimes you do be feeling fancy like.\n\nMore pop reviews: https://www.youtube.com/playlist?list=PLP4CSgl7K7oqibt_5oDPppWxQ0iaxyyeq\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nWALKER HAYES - COUNTRY STUFF THE ALBUM / 2022 / MONUMENT / POP COUNTRY\n\nNOT BAD/10\n\nY'all know this is just my opinion, right?",
};

const notGoodReview5: Video = {
  publishedAt: '2021-07-09T03:11:51Z',
  title: 'The Revenge of Hobo Johnson: NOT GOOD',
  description:
    "Listen: https://youtu.be/ks9qRYLJBNQ\n\nIn this case, it probably would've been better for Hobo Johnson to turn the other cheek.\n\n===================================\nSubscribe: http://bit.ly/1pBqGCN\n\nPatreon: https://www.patreon.com/theneedledrop\n\nOfficial site: http://theneedledrop.com\n\nTwitter: http://twitter.com/theneedledrop\n\nInstagram: https://www.instagram.com/afantano\n\nTikTok: https://www.tiktok.com/@theneedletok\n\nTND Twitch: https://www.twitch.tv/theneedledrop\n===================================\n\nHOBO JOHNSON - THE REVENGE OF HOBO JOHNSON / 2021 / SELF-RELEASED / ANTI-FOLK, SPOKEN(/SHOUTED) WORD\n\nNOT GOOD/10\n\nY'all know this is just my opinion, right?",
};

const notGoodReview6: Video = {
  publishedAt: '2020-08-13T00:02:07Z',
  title: "Glass Animals' Dreamland: NOT GOOD",
  description:
    "Listen: https://www.youtube.com/watch?v=BE7vBk_zLA4\r\n\r\nDreamland is a nightmare of derivative and shallow-end indie trap pop.\r\n\r\nMore pop reviews: https://www.youtube.com/playlist?list=PLP4CSgl7K7oqibt_5oDPppWxQ0iaxyyeq\r\n\r\n===================================\r\nSubscribe: http://bit.ly/1pBqGCN\r\n\r\nPatreon: https://www.patreon.com/theneedledrop\r\n\r\nOfficial site: http://theneedledrop.com\r\n\r\nTND Twitter: http://twitter.com/theneedledrop\r\n\r\nTND Facebook: http://facebook.com/theneedledrop\r\n\r\nSupport TND: http://theneedledrop.com/support\r\n===================================\r\n\r\nGLASS ANIMALS - DREAMLAND / 2020 / WOLF TONE / POP, INDIETRONIC, TRAP\r\n\r\nNOT GOOD/10\r\n\r\nY'all know this is just my opinion, right?",
};

describe('parse', () => {
  it('should parse a new review in the format ARTIST- TITLE', () => {
    const eitherErrorOrReview = parse(newReviewWithImmediateHyphen);
    const expectedReview: Review = {
      type: 'standard',
      artist: 'Kendrick Lamar',
      title: 'good kid, m.A.A.d. city',
      rating: 9,
      genres: ['WEST COAST HIP HOP', 'CONSCIOUS HIP HOP'],
      publishedAt: '2012-10-22T14:27:09Z',
    };

    expect(eitherErrorOrReview).toStrictEqual(Right(expectedReview));
  });

  it('should parse a new review in the format ARTIST - TITLE', () => {
    const eitherErrorOrReview = parse(newReviewWithSpacedHyphen);
    const expectedReview: Review = {
      type: 'standard',
      artist: 'Kendrick Lamar',
      title: 'Mr. Morale & The Big Steppers',
      rating: 8,
      genres: [],
      publishedAt: '2022-05-17T04:59:34Z',
    };

    expect(eitherErrorOrReview).toStrictEqual(Right(expectedReview));
  });

  it('should parse an old review', () => {
    const eitherErrorOrReview = parse(oldReview);
    const expectedReview: Review = {
      type: 'standard',
      artist: 'Gorillaz',
      title: 'Plastic Beach',
      rating: 7,
      genres: [],
      publishedAt: '2010-03-03T03:25:15Z',
    };

    expect(eitherErrorOrReview).toStrictEqual(Right(expectedReview));
  });

  it.todo('should parse a classic review', () => {});

  it.todo('should parse a not good review', () => {});

  it.todo('should parse a tens review', () => {});

  it.todo('should parse a known edge case review', () => {
    const eitherErrorOrReview = parse(edgeCaseReview);
    const expectedReview: Review = {
      type: 'standard',
      artist: 'CX KiDTRONiK',
      title: 'KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF',
      rating: 6,
      genres: [
        'EXPERIMENTAL HIP HOP',
        'INDUSTRIAL HIP HOP',
        'DIGITAL HARDCORE',
        'DRUM MACHINE METAL THAT RIPS YOUR FACE OFF',
      ],
      publishedAt: '2013-06-05T14:56:57Z',
    };

    expect(eitherErrorOrReview).toStrictEqual(Right(expectedReview));
  });

  it.todo('should fix known an edge case genre typo', () => {});

  it.todo('it should filter out known labels from genres', () => {});
});
