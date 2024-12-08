const fs = require("fs");
const express = require("express");
const cors = require("cors");
const seats = require("./Seatsdb");

const app = express();
app.use(cors());
app.use(express.json());

// Utility function to update the seats database
function updateSeatsDB(updatedSeats) {
  fs.writeFileSync(
    "./Seatsdb.js",
    `const seats = ${JSON.stringify(updatedSeats, null, 2)};\n\nmodule.exports = seats;`
  );
}

// GET: Fetch all seats
app.get("/seats", (req, res) => res.send(seats));

// POST: Book seats
app.post("/book-seats", (req, res) => {
  const { numSeats } = req.body;

  if (!numSeats || numSeats < 1 || numSeats > 7) {
    return res.status(400).send({
      status: false,
      error: "You can only book 1 to 7 seats.",
    });
  }

  const availableSeats = seats.filter((seat) => !seat.is_booked);

  if (availableSeats.length < numSeats) {
    return res.status(400).send({
      status: false,
      error: "Not enough seats available.",
    });
  }

  let bookedSeats = [];
  for (let row = 1; row <= 12; row++) {
    const rowSeats = availableSeats.filter((seat) => seat.row_number === row);
    if (rowSeats.length >= numSeats) {
      bookedSeats = rowSeats.slice(0, numSeats);
      break;
    }
  }

  if (bookedSeats.length === 0) {
    bookedSeats = availableSeats.slice(0, numSeats);
  }

  bookedSeats.forEach((seat) => (seat.is_booked = true));
  updateSeatsDB(seats);

  res.send({
    status: true,
    message: "Seats booked successfully!",
    bookedSeats: bookedSeats.map(
      (seat) => `Row ${seat.row_number} - Seat ${seat.seat_number}`
    ),
  });
});

// POST: Reset all seats
app.post("/reset-seats", (req, res) => {
  seats.forEach((seat) => (seat.is_booked = false));
  updateSeatsDB(seats);

  res.send({
    status: true,
    message: "All seats have been reset to available.",
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
