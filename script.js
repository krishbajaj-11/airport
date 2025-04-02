// 🛫 Fetch All Flights
function fetchFlights() {
    fetch("http://localhost:3000/flights")
        .then(res => res.json())
        .then(data => {
            console.log("Flight Data:", data);  // Debugging log
            const tableBody = document.querySelector("#flightsTable tbody");
            tableBody.innerHTML = "";
            data.forEach(flight => {
                tableBody.innerHTML += `<tr>
                    <td>${flight.Flight_ID}</td>
                    <td>${flight.Source}</td>
                    <td>${flight.Destination}</td>
                    <td>${flight.Departure_Time}</td>
                    <td>${flight.Arrival_Time}</td>
                </tr>`;
            });
        })
        .catch(err => console.error("Fetch error:", err));
}


// 🎫 Book a Ticket
function bookTicket() {
    const passengerID = document.getElementById("passengerID").value;
    const flightID = document.getElementById("flightID").value;
    const seatNo = document.getElementById("seatNo").value;

    console.log("Passenger ID:", passengerID);
    console.log("Flight ID:", flightID);
    console.log("Seat No:", seatNo);

    fetch("http://localhost:3000/book-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            passenger_id: passengerID,
            flight_id: flightID,
            seat_no: seatNo,
            payment_status: "Paid"
        })
    })
    .then(res => res.json())
    .then(data => console.log("Booking Response:", data))
    .catch(err => console.error("Fetch error:", err));
}


// 🎟 Fetch Passenger Tickets
function fetchTickets() {
    const passengerID = document.getElementById("viewPassengerID").value;
    fetch(`http://localhost:3000/tickets/${passengerID}`)
        .then(res => res.json())
        .then(data => {
            const tableBody = document.querySelector("#ticketsTable tbody");
            tableBody.innerHTML = "";
            data.forEach(ticket => {
                tableBody.innerHTML += `<tr>
                    <td>${ticket.Booking_ID}</td>
                    <td>${ticket.Passenger_ID}</td>
                    <td>${ticket.Flight_ID}</td>
                    <td>${ticket.Seat_No}</td>
                    <td>${ticket.Booking_Date}</td>
                    <td>${ticket.Payment_Status}</td>
                </tr>`;
            });
        });
}
