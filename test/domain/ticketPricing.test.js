import { calculateTotalAmount, calculateSeatsRequired } from '../../src/pairtest/domain/ticketPricing.js';

describe('ticketPricing (pure functions, no mocks)', () => {
  test.each([
    [{ ADULT: 0, CHILD: 0, INFANT: 0 }, 0, 0],
    [{ ADULT: 1, CHILD: 0, INFANT: 0 }, 25, 1],
    [{ ADULT: 0, CHILD: 1, INFANT: 0 }, 15, 1],
    [{ ADULT: 2, CHILD: 1, INFANT: 3 }, 65, 3],
    [{ ADULT: 25, CHILD: 0, INFANT: 0 }, 625, 25],
  ])('%j => £%i, %i seats', (counts, amount, seats) => {
    expect(calculateTotalAmount(counts)).toBe(amount);
    expect(calculateSeatsRequired(counts)).toBe(seats);
  });

  test('infants are free and take no seat', () => {
    const counts = { ADULT: 1, CHILD: 0, INFANT: 1 };
    expect(calculateTotalAmount(counts)).toBe(25);
    expect(calculateSeatsRequired(counts)).toBe(1);
  });
});
