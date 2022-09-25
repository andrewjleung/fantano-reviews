import { Maybe } from 'purify-ts';

export const maybeOf = Maybe.fromNullable;

// https://stackoverflow.com/a/68878318
export const bind =
  <N extends string, A extends object, T>(
    name: Exclude<N, keyof A>,
    f: (acc: A) => Maybe<T>,
  ) =>
  (acc: A): Maybe<A & Record<N, T>> =>
    f(acc).map((r) => ({ ...acc, [name]: r } as A & Record<N, T>));
