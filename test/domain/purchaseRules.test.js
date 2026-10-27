import {
  assertValidAccountId,
  tallyTickets,
  assertAdultPresent,
  assertInfantsHaveLaps,
} from '../../src/pairtest/domain/purchaseRules.js';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException.js';

const req = (type, n) => new TicketTypeRequest(type, n);

describe('purchaseRules (pure functions, no mocks)', () => {
  describe('assertValidAccountId', () => {
    test.each([1, 42, Number.MAX_SAFE_INTEGER])('accepts %p', (id) => {
      expect(() => assertValidAccountId(id)).not.toThrow();
    });

    test.each([0, -5, 1.5, '1', null, undefined, NaN, Infinity, 2 ** 53])('rejects %p', (id) => {
      expect(() => assertValidAccountId(id)).toThrow(InvalidPurchaseException);
    });
  });

  describe('tallyTickets', () => {
    test('aggregates quantities per type across requests', () => {
      expect(tallyTickets([req('ADULT', 1), req('CHILD', 2), req('ADULT', 3), req('INFANT', 1)]))
        .toEqual({ ADULT: 4, CHILD: 2, INFANT: 1 });
    });

    test('accepts exactly the maximum', () => {
      expect(tallyTickets([req('ADULT', 25)])).toEqual({ ADULT: 25, CHILD: 0, INFANT: 0 });
    });

    test.each([
      ['no requests', []],
      ['over the maximum', [req('ADULT', 26)]],
      ['over the maximum across requests', [req('ADULT', 13), req('CHILD', 13)]],
      ['zero quantity', [req('ADULT', 0)]],
      ['negative quantity', [req('ADULT', 30), req('ADULT', -10)]],
      ['non-TicketTypeRequest', [{ type: 'ADULT' }]],
    ])('rejects %s', (_label, requests) => {
      expect(() => tallyTickets(requests)).toThrow(InvalidPurchaseException);
    });
  });

  describe('assertAdultPresent', () => {
    test.each([
      [{ ADULT: 1, CHILD: 2, INFANT: 1 }],
      [{ ADULT: 1, CHILD: 0, INFANT: 0 }],
    ])('accepts %j', (counts) => {
      expect(() => assertAdultPresent(counts)).not.toThrow();
    });

    test.each([
      [{ ADULT: 0, CHILD: 1, INFANT: 0 }],
      [{ ADULT: 0, CHILD: 0, INFANT: 1 }],
    ])('rejects %j', (counts) => {
      expect(() => assertAdultPresent(counts)).toThrow(InvalidPurchaseException);
    });
  });

  describe('assertInfantsHaveLaps (inferred rule)', () => {
    test('accepts infants equal to adults', () => {
      expect(() => assertInfantsHaveLaps({ ADULT: 2, CHILD: 0, INFANT: 2 })).not.toThrow();
    });

    test('rejects more infants than adults', () => {
      expect(() => assertInfantsHaveLaps({ ADULT: 1, CHILD: 0, INFANT: 2 }))
        .toThrow(InvalidPurchaseException);
    });
  });
});
