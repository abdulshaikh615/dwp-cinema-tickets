import TicketTypeRequest from '../lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../lib/InvalidPurchaseException.js';
import { TICKET_TYPES, MAX_TICKETS_PER_PURCHASE } from '../config/ticketRules.js';

export function assertValidAccountId(accountId) {
  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    throw new InvalidPurchaseException('accountId must be an integer greater than zero');
  }
}

// TicketTypeRequest guarantees a valid type and an integer quantity, but it
// allows zero and negatives, so quantity bounds are enforced here.
export function tallyTickets(requests) {
  if (requests.length === 0) {
    throw new InvalidPurchaseException('at least one ticket request is required');
  }

  const counts = {
    [TICKET_TYPES.ADULT]: 0,
    [TICKET_TYPES.CHILD]: 0,
    [TICKET_TYPES.INFANT]: 0,
  };
  let total = 0;

  for (const request of requests) {
    if (!(request instanceof TicketTypeRequest)) {
      throw new InvalidPurchaseException('every request must be a TicketTypeRequest');
    }

    const quantity = request.getNoOfTickets();
    if (quantity < 1) {
      throw new InvalidPurchaseException('each request must be for at least one ticket');
    }

    total += quantity;
    if (total > MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException(
        `a maximum of ${MAX_TICKETS_PER_PURCHASE} tickets can be purchased at a time`,
      );
    }

    counts[request.getTicketType()] += quantity;
  }

  return counts;
}

// Rule stated in the brief.
export function assertAdultPresent(counts) {
  const hasDependants = counts[TICKET_TYPES.CHILD] > 0 || counts[TICKET_TYPES.INFANT] > 0;
  if (hasDependants && counts[TICKET_TYPES.ADULT] === 0) {
    throw new InvalidPurchaseException(
      'child and infant tickets cannot be purchased without an adult ticket',
    );
  }
}

// Rule INFERRED from "infants sit on an adult's lap" (one lap per adult).
// Documented as an assumption in the README. Delete this function and its
// call in TicketService to follow the brief literally.
export function assertInfantsHaveLaps(counts) {
  if (counts[TICKET_TYPES.INFANT] > counts[TICKET_TYPES.ADULT]) {
    throw new InvalidPurchaseException('each infant must be accompanied by its own adult');
  }
}
