/**
 * Business rules in one place, so a price or limit change never touches logic.
 * Prices are whole pounds (integers), as TicketPaymentService requires an integer.
 */
export const TICKET_TYPES = Object.freeze({
  ADULT: 'ADULT',
  CHILD: 'CHILD',
  INFANT: 'INFANT',
});

export const TICKET_PRICES_GBP = Object.freeze({
  [TICKET_TYPES.ADULT]: 25,
  [TICKET_TYPES.CHILD]: 15,
  [TICKET_TYPES.INFANT]: 0,
});

export const MAX_TICKETS_PER_PURCHASE = 25;
