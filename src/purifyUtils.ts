import { Either, EitherAsync, Maybe } from 'purify-ts';

export const maybeOf = Maybe.fromNullable;

// https://stackoverflow.com/a/68878318
export const bindM =
  <N extends string, A extends object, T>(
    name: Exclude<N, keyof A>,
    f: (acc: A) => Maybe<T>,
  ) =>
  (acc: A): Maybe<A & Record<N, T>> =>
    f(acc).map((r) => ({ ...acc, [name]: r } as A & Record<N, T>));

export const bindE =
  <N extends string, A extends object, L, R>(
    name: Exclude<N, keyof A>,
    f: (acc: A) => Either<L, R>,
  ) =>
  (acc: A): Either<L, A & Record<N, R>> =>
    f(acc).map((r) => ({ ...acc, [name]: r } as A & Record<N, R>));

export const bindNullableToEither = <N extends string, A extends object, L, R>(
  name: Exclude<N, keyof A>,
  nullable: R | undefined | null,
  error: L,
): ((acc: A) => Either<L, A & Record<N, R>>) =>
  bindE(name, () => maybeOf(nullable).toEither(error));

export const bindFalsyToEither = <N extends string, A extends object, L, R>(
  name: Exclude<N, keyof A>,
  nullable: R | undefined | null,
  error: L,
): ((acc: A) => Either<L, A & Record<N, R>>) =>
  bindE(name, () => Maybe.fromFalsy(nullable).toEither(error));

export const liftE =
  <L, R>(either: Either<L, R>) =>
  () =>
    EitherAsync.liftEither(either);
