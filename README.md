# dwp-cinema-tickets
DWP Cinema Tickets Assesment

How to run

npm install
npm test

How it works

purchaseTickets does the same steps every time:

Check the account ID.
Count the tickets by type and check each request and the 25 limit.
Check the adult rules.
Work out the price and the number of seats.
Take payment, then reserve seats.
How the code is organised
src/pairtest/
  TicketService.js          runs the steps above
  config/ticketRules.js     prices and the 25 limit
  domain/purchaseRules.js   the validation rules
  domain/ticketPricing.js   price and seat calculations
test/                       unit tests

TicketService only handles the flow. The rules and pricing are small functions in their own files, so they are easy to read and test without mocks. I did not change the TicketService method signature, the third-party code or TicketTypeRequest.

Choices I made
No try/catch. The exception is the answer the caller needs, so I let it pass through instead of hiding it.
No sanitising. Nothing here goes into a database or a web page. The inputs are numbers and typed objects, so I validate them strictly and reject anything wrong.
Extra quantity check. TicketTypeRequest allows zero and negative numbers. Without a check, ADULT 30 plus ADULT -10 would get past the limit, so I reject them.
Dependencies can be passed in. new TicketService() works normally, but tests can pass in fake payment and seat services.


Assumptions
The 25 ticket limit includes infants.
Each infant sits on one adult's lap, so there can't be more infants than adults. This is my reading of the brief. It lives in one function, assertInfantsHaveLaps, so it is easy to remove.
Several requests of the same type in one purchase are added together.
Payment and seat reservation always work, as the brief says.
Not covered

If payment works but seat reservation then fails, the customer has paid without a seat. The brief says to ignore this, but a real system would need a refund or a retry step.

Tests

75 tests cover the prices, seat counts, boundaries at 25 and 26, bad account IDs, bad requests, and the rule that nothing happens when a purchase is rejected. Coverage is 100% on the service, config and domain files, and the build fails if it drops.