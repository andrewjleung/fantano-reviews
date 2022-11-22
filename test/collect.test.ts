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
  publishedAt: '2022-11-19T01:00:01Z',
};

const classicReview: ClassicReview = {
  type: 'classic',
  artist: 'foo',
  title: 'bar',
  genres: ['genre1', 'genre2'],
  publishedAt: '2022-11-19T01:00:01Z',
};

const notGoodReview: NotGoodReview = {
  type: 'not-good',
  artist: 'foo',
  title: 'bar',
  genres: ['genre1', 'genre2'],
  publishedAt: '2022-11-19T01:00:01Z',
};

const tensReview: TensReview = {
  type: 'tens',
  albums: [
    { artist: 'foo', title: 'bar' },
    { artist: 'foo1', title: 'bar1' },
    { artist: 'foo2', title: 'bar2' },
  ],
  publishedAt: '2022-11-19T01:00:01Z',
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
          publishedAt: '2022-11-19T01:00:01Z',
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
          publishedAt: '2022-11-20T01:00:01Z',
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
          publishedAt: '2022-11-20T01:00:01Z',
        },
      ],
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 'CLASSIC',
          genres: ['genre1', 'genre2'],
          publishedAt: '2022-11-19T01:00:01Z',
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
          publishedAt: '2022-11-19T01:00:01Z',
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
          publishedAt: '2022-11-19T01:00:01Z',
        },
      ],
      [
        'foo1::bar1',
        {
          artist: 'foo1',
          title: 'bar1',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-19T01:00:01Z',
        },
      ],
      [
        'foo2::bar2',
        {
          artist: 'foo2',
          title: 'bar2',
          rating: 10,
          genres: [],
          publishedAt: '2022-11-19T01:00:01Z',
        },
      ],
    ]);
  });

  it('favors an existing review if it is was published later', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 0,
          genres: ['genre0'],
          publishedAt: '2022-11-19T01:00:02Z',
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
          rating: 0,
          genres: ['genre0', 'genre1', 'genre2'],
          publishedAt: '2022-11-19T01:00:02Z',
        },
      ],
    ]);
  });

  it('favors a new review if it was published later', () => {
    const rows = new Map<string, ReviewRow>([
      [
        'foo::bar',
        {
          artist: 'foo',
          title: 'bar',
          rating: 0,
          genres: ['genre0'],
          publishedAt: '2022-11-19T01:00:00Z',
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
          publishedAt: '2022-11-19T01:00:01Z',
        },
      ],
    ]);
  });
});
