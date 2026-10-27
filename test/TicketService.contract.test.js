import { jest } from '@jest/globals';
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

const adult = (n) => new TicketTypeRequest('ADULT', n);

describe('TicketService contract and construction', () => {
  test.each([
    ['missing makePayment', {}, { reserveSeat: jest.fn() }],
    ['missing reserveSeat', { makePayment: jest.fn() }, {}],
    ['null payment service', null, { reserveSeat: jest.fn() }],
    ['null seat service', { makePayment: jest.fn() }, null],
  ])('rejects bad dependencies: %s', (_label, pay, seat) => {
    expect(() => new TicketService(pay, seat)).toThrow(TypeError);
  });

  test('exposes only purchaseTickets publicly (brief constraint)', () => {
    expect(Object.getOwnPropertyNames(TicketService.prototype))
      .toEqual(['constructor', 'purchaseTickets']);
  });

  test('rejects an account id beyond the safe integer range', () => {
    const payment = { makePayment: jest.fn() };
    const seats = { reserveSeat: jest.fn() };
    const service = new TicketService(payment, seats);
    expect(() => service.purchaseTickets(2 ** 53, adult(1))).toThrow(InvalidPurchaseException);
    expect(payment.makePayment).not.toHaveBeenCalled();
  });

  test('does not swallow a reservation failure after payment (documented gap)', () => {
    const payment = { makePayment: jest.fn() };
    const seats = { reserveSeat: jest.fn(() => { throw new Error('seat service down'); }) };
    const service = new TicketService(payment, seats);
    expect(() => service.purchaseTickets(1, adult(1))).toThrow('seat service down');
    expect(payment.makePayment).toHaveBeenCalledTimes(1);
  });
});
