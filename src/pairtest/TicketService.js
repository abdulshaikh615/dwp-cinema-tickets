import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import {
  assertValidAccountId,
  tallyTickets,
  assertAdultPresent,
  assertInfantsHaveLaps,
} from './domain/purchaseRules.js';
import { calculateTotalAmount, calculateSeatsRequired } from './domain/ticketPricing.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #paymentService;

  #seatReservationService;

  constructor(
    paymentService = new TicketPaymentService(),
    seatReservationService = new SeatReservationService(),
  ) {
    // Fail fast on mis-wiring rather than halfway through a purchase.
    if (typeof paymentService?.makePayment !== 'function') {
      throw new TypeError('paymentService must implement makePayment');
    }
    if (typeof seatReservationService?.reserveSeat !== 'function') {
      throw new TypeError('seatReservationService must implement reserveSeat');
    }

    this.#paymentService = paymentService;
    this.#seatReservationService = seatReservationService;
  }

  /**
   * Validates the purchase, takes payment, then reserves seats.
   * Nothing is paid for or reserved unless the whole purchase is valid.
   *
   * @param {number} accountId positive integer
   * @param {...TicketTypeRequest} ticketTypeRequests
   * @throws {InvalidPurchaseException} if the purchase breaks any business rule
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    assertValidAccountId(accountId);
    const counts = tallyTickets(ticketTypeRequests);
    assertAdultPresent(counts);
    assertInfantsHaveLaps(counts);

    this.#paymentService.makePayment(accountId, calculateTotalAmount(counts));
    this.#seatReservationService.reserveSeat(accountId, calculateSeatsRequired(counts));
  }
}
