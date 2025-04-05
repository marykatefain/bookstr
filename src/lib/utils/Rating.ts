/** Normalized rating class. */
export class Rating {
  /** Fraction of the rating, between 0 and 1. */
  readonly fraction: number;

  constructor(
    /** Fraction of the rating, between 0 and 1. */
    fraction: number,
  ) {
    if (fraction < 0 || fraction > 1) {
      throw new Error('Fraction must be between 0 and 1');
    }
    this.fraction = fraction;
  }

  /** Returns the rating as a number between 0 and `outOf`. */
  toScale(outOf: number = 5): number {
    return this.fraction * outOf;
  }

  /** Returns the rating as a number between 0 and 1. */
  static fromScale(
    /** Fraction of the rating, between 0 and 1. */
    fraction: number,
    /** The scale to convert from. */
    outOf: number = 5,
  ): Rating {
    return new Rating(fraction / outOf);
  }
}