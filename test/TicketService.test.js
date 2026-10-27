import { jest } from '@jest/globals';
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

const adult = (n) => new TicketTypeRequest('ADULT', n);
const child = (n) => new TicketTypeRequest('CHILD', n);
const infant = (n) => new TicketTypeRequest('INFANT', n);

describe('TicketService', () => {
  let payment;
  let seats;
  let service;

  beforeEach(() => {
    payment = { makePayment: jest.fn() };
    seats = { reserveSeat: jest.fn() };
    service = new TicketService(payment, seats);
  });

  const expectRejected = (accountId, ...requests) => {
    expect(() => service.purchaseTickets(accountId, ...requests)).toThrow(InvalidPurchaseException);
    // A rejected purchase must never cause a payment or a reservation.
    expect(payment.makePayment).not.toHaveBeenCalled();
    expect(seats.reserveSeat).not.toHaveBeenCalled();
  };

  describe('valid purchases: pricing and seats', () => {
    test.each([
      ['1 adult', [adult(1)], 25, 1],
      ['2 adults + 3 children', [adult(2), child(3)], 95, 5],
      ['1 adult + 1 infant (infant free, no seat)', [adult(1), infant(1)], 25, 1],
      ['2 adults + 1 child + 2 infants', [adult(2), child(1), infant(2)], 65, 3],
      ['same type split across requests is aggregated', [adult(1), adult(2), child(1)], 90, 4],
      ['exactly 25 tickets (adults only)', [adult(25)], 625, 25],
      ['exactly 25 tickets including infants', [adult(20), infant(5)], 500, 20],
    ])('%s', (_label, requests, expectedAmount, expectedSeats) => {
      service.purchaseTickets(7, ...requests);

      expect(payment.makePayment).toHaveBeenCalledTimes(1);
      expect(payment.makePayment).toHaveBeenCalledWith(7, expectedAmount);
      expect(seats.reserveSeat).toHaveBeenCalledTimes(1);
      expect(seats.reserveSeat).toHaveBeenCalledWith(7, expectedSeats);
    });

    test('takes payment before reserving seats', () => {
      const order = [];
      payment.makePayment.mockImplementation(() => order.push('pay'));
      seats.reserveSeat.mockImplementation(() => order.push('reserve'));

      service.purchaseTickets(1, adult(1));

      expect(order).toEqual(['pay', 'reserve']);
    });

    test('works with the real third-party services via the default constructor', () => {
      expect(() => new TicketService().purchaseTickets(1, adult(2), child(1))).not.toThrow();
    });
  });

  describe('invalid account id', () => {
    test.each([0, -1, 1.5, '1', null, undefined, NaN, Infinity])('rejects %p', (accountId) => {
      expectRejected(accountId, adult(1));
    });
  });

  describe('invalid request lists', () => {
    test('rejects no requests', () => {
      expectRejected(1);
    });

    test.each([
      ['plain object', { type: 'ADULT', noOfTickets: 1 }],
      ['null', null],
      ['undefined', undefined],
      ['string', 'ADULT'],
    ])('rejects a non-TicketTypeRequest (%s)', (_label, bad) => {
      expectRejected(1, adult(1), bad);
    });
  });

  describe('invalid quantities', () => {
    test('rejects a zero-quantity request', () => {
      expectRejected(1, adult(1), child(0));
    });

    test('rejects a negative quantity', () => {
      expectRejected(1, adult(2), child(-1));
    });

    test('rejects negative quantities used to bypass the maximum', () => {
      expectRejected(1, adult(30), adult(-10));
    });

    test('rejects a negative quantity used to reduce the price', () => {
      expectRejected(1, adult(2), adult(-1), child(1));
    });
  });

  describe('maximum tickets', () => {
    test('rejects 26 adults', () => {
      expectRejected(1, adult(26));
    });

    test('rejects 26 tickets spread across types', () => {
      expectRejected(1, adult(10), child(10), infant(6));
    });

    test('rejects when the cap is exceeded across multiple requests', () => {
      expectRejected(1, adult(13), adult(13));
    });

    test('counts infants towards the maximum', () => {
      expectRejected(1, adult(21), infant(5));
    });
  });

  describe('adult accompaniment rules', () => {
    test.each([
      ['child only', [child(1)]],
      ['infant only', [infant(1)]],
      ['child and infant, no adult', [child(2), infant(1)]],
    ])('rejects %s', (_label, requests) => {
      expectRejected(1, ...requests);
    });

    test('rejects more infants than adults', () => {
      expectRejected(1, adult(1), infant(2));
    });

    test('allows infants equal to adults', () => {
      service.purchaseTickets(1, adult(2), infant(2));
      expect(payment.makePayment).toHaveBeenCalledWith(1, 50);
      expect(seats.reserveSeat).toHaveBeenCalledWith(1, 2);
    });
  });
});

describe('TicketTypeRequest immutability', () => {
  test('cannot be mutated after construction', () => {
    const request = new TicketTypeRequest('ADULT', 2);
    expect(() => { request.noOfTickets = 99; request.type = 'CHILD'; }).not.toThrow();
    expect(request.getNoOfTickets()).toBe(2);
    expect(request.getTicketType()).toBe('ADULT');
  });
});
