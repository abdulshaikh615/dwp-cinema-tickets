import { TICKET_PRICES_GBP, TICKET_TYPES } from '../config/ticketRules.js';

// Prices are whole pounds because TicketPaymentService requires an integer.
export const calculateTotalAmount = (counts) => Object.entries(counts).reduce(
  (sum, [type, quantity]) => sum + quantity * TICKET_PRICES_GBP[type],
  0,
);

// Infants are not allocated a seat.
export const calculateSeatsRequired = (counts) => counts[TICKET_TYPES.ADULT]
  + counts[TICKET_TYPES.CHILD];
