import { describe, expect, it } from 'vitest';
import collect from '../src/collect.js';
import {
  ClassicReview,
  NotGoodReview,
  ReviewRow,
  StandardReview,
  TensReview,
} from '../src/types';

const standardReview: StandardReview = {
  type: 'standard',
  artist: 'foo',
  title: 'bar',
  rating: 1,
  genres: ['genre1', 'genre2'],
  publishedAt: '2022-11-19',
};

const classicReview: ClassicReview = {
  type: 'classic',
  artist: 'foo',
  title: 'bar',
  genres: ['genre1', 'genre2'],
  publishedAt: '2022-11-19',
};

const notGoodReview: NotGoodReview = {
  type: 'not-good',
  artist: 'foo',
  title: 'bar',
  genres: ['genre1', 'genre2'],
  publishedAt: '2022-11-19',
};

const tensReview: TensReview = {
  type: 'tens',
  albums: [
    { artist: 'foo', title: 'bar' },
    { artist: 'foo1', title: 'bar1' },
    { artist: 'foo2', title: 'bar2' },
  ],
  publishedAt: '2022-11-19',
};

describe('collect', () => {
  it('collects a standard review', () => {
    const rows = new Map<string, ReviewRow>();
    collect(rows, standardReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 1,
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('collects a classic review', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo1::bar1',
        {
          artist: 'foo1',
          title: 'bar1',
          rating: 5,
          genres: ['genre3', 'genre4'],
          publishedAt: '2022-11-20',
        },
      ],
    ]);
    collect(rows, classicReview);

    expect([...rows]).toStrictEqual([
      [
        'foo1::bar1',
        {
          artist: 'foo1',
          title: 'bar1',
          rating: 5,
          genres: ['genre3', 'genre4'],
          publishedAt: '2022-11-20',
        },
      ],
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 'CLASSIC',
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('collects a not good review', () => {
    const rows = new Map<string, ReviewRow>();
    collect(rows, notGoodReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 'NOT GOOD',
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('collects a tens review', () => {
    const rows = new Map<string, ReviewRow>();
    collect(rows, tensReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-19',
        },
      ],
      [
        'foo1::bar1',
        {
          artist: 'foo1',
          title: 'bar1',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-19',
        },
      ],
      [
        'foo2::bar2',
        {
          artist: 'foo2',
          title: 'bar2',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('favors an existing review with a higher rating when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, standardReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);
  });

  it('favors a new review with a higher rating when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 0,
          genres: ['genre0'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, standardReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 1,
          genres: ['genre0', 'genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('favors an existing numeric review over a new classic review when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: ['genre1'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, classicReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);
  });

  it('favors a new numeric review over an existing classic review when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 'CLASSIC',
          genres: ['genre0'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, standardReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 1,
          genres: ['genre0', 'genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });

  it('favors an existing numeric review over a new not good review when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: ['genre1'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, notGoodReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 10,
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);
  });

  it('favors a new numeric review over an existing not good review when merging', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 'NOT GOOD',
          genres: ['genre0'],
          publishedAt: '2022-11-18',
        },
      ],
    ]);

    collect(rows, standardReview);

    expect([...rows]).toStrictEqual([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 1,
          genres: ['genre0', 'genre1', 'genre2'],
          publishedAt: '2022-11-19',
        },
      ],
    ]);
  });
});
