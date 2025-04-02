const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "krish",
    database: "airport"
});

// ✅ Get All Flights
app.get("/flights", (req, res) => {
    db.query("SELECT * FROM Flight", (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// ✅ Book a Ticket
app.post("/book-ticket", (req, res) => {
    console.log("Received Booking Data:", req.body);  // Debug log

    const { passenger_id, flight_id, seat_no, payment_status } = req.body;

    if (!passenger_id || !flight_id || !seat_no) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    db.query(
        "INSERT INTO Ticket_Booking (Passenger_ID, Flight_ID, Seat_No, Booking_Date, Payment_Status) VALUES (?, ?, ?, NOW(), ?)",
        [passenger_id, flight_id, seat_no, payment_status],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ message: "Ticket booked successfully", booking_id: result.insertId });
        }
    );
});


// ✅ Fetch Passenger Tickets
app.get("/tickets/:passengerID", (req, res) => {
    const passengerID = req.params.passengerID;
    db.query("SELECT * FROM Ticket_Booking WHERE Passenger_ID = ?", [passengerID], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));
