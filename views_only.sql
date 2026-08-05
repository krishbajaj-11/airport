USE airport;

CREATE OR REPLACE VIEW vw_FlightOccupancy AS
SELECT
    f.Flight_ID,
    f.Source,
    f.Destination,
    a.Name                                          AS Airline_Name,
    f.Departure_Time,
    f.Status,
    COUNT(tb.Booking_ID)                            AS Booked_Seats,
    f.Available_Seats                               AS Remaining_Seats,
    (COUNT(tb.Booking_ID) + f.Available_Seats)      AS Total_Capacity,
    ROUND(
        COUNT(tb.Booking_ID) /
        NULLIF(COUNT(tb.Booking_ID) + f.Available_Seats, 0) * 100
    , 1)                                            AS Occupancy_Pct
FROM flight f
LEFT JOIN ticket_booking tb ON f.Flight_ID   = tb.Flight_ID
                            AND tb.Payment_Status != 'Canceled'
LEFT JOIN Airline a          ON f.Airline_ID = a.Airline_id
GROUP BY f.Flight_ID, f.Source, f.Destination, a.Name,
         f.Departure_Time, f.Status, f.Available_Seats;

CREATE OR REPLACE VIEW vw_RevenueByAirline AS
SELECT
    a.Airline_id,
    a.Name                          AS Airline_Name,
    a.Country,
    COUNT(tb.Booking_ID)            AS Total_Bookings,
    SUM(CASE WHEN tb.Payment_Status = 'Paid' THEN 1 ELSE 0 END) AS Paid_Bookings,
    SUM(CASE WHEN tb.Payment_Status = 'Paid' THEN 5000 ELSE 0 END) AS Revenue_INR
FROM Airline a
LEFT JOIN flight f       ON a.Airline_id   = f.Airline_ID
LEFT JOIN ticket_booking tb ON f.Flight_ID = tb.Flight_ID
GROUP BY a.Airline_id, a.Name, a.Country;

CREATE OR REPLACE VIEW vw_RoutePopularity AS
SELECT
    f.Source,
    f.Destination,
    CONCAT(f.Source, ' -> ', f.Destination)     AS Route,
    COUNT(DISTINCT f.Flight_ID)                 AS Total_Flights,
    COUNT(tb.Booking_ID)                        AS Total_Bookings,
    SUM(CASE WHEN tb.Payment_Status='Paid'
        THEN 1 ELSE 0 END)                      AS Confirmed_Bookings,
    ROUND(AVG(f.Available_Seats), 0)            AS Avg_Available_Seats
FROM flight f
LEFT JOIN ticket_booking tb ON f.Flight_ID = tb.Flight_ID
GROUP BY f.Source, f.Destination
ORDER BY Total_Bookings DESC;

CREATE OR REPLACE VIEW vw_TopPassengers AS
SELECT
    p.Passenger_id,
    p.Name,
    p.Email,
    p.Nationality,
    COALESCE(r.Points, 0)                       AS Points,
    COALESCE(r.Tier, 'Bronze')                  AS Tier,
    COUNT(tb.Booking_ID)                        AS Total_Bookings,
    SUM(CASE WHEN tb.Payment_Status='Paid'
        THEN 1 ELSE 0 END)                      AS Paid_Bookings,
    RANK() OVER (ORDER BY COALESCE(r.Points,0) DESC) AS Loyalty_Rank
FROM Passenger p
LEFT JOIN Rewards      r  ON p.Passenger_id = r.Passenger_ID
LEFT JOIN ticket_booking tb ON p.Passenger_id = tb.Passenger_ID
GROUP BY p.Passenger_id, p.Name, p.Email, p.Nationality, r.Points, r.Tier;

CREATE OR REPLACE VIEW vw_PassengerProfile AS
SELECT
    p.Passenger_id,
    p.Name,
    p.Email,
    p.Nationality,
    p.Passport_No,
    p.Phone_No,
    COUNT(DISTINCT tb.Booking_ID)               AS Total_Bookings,
    COUNT(DISTINCT CASE WHEN tb.Payment_Status = 'Paid'
        THEN tb.Booking_ID END)                 AS Paid_Bookings,
    COUNT(DISTINCT CASE WHEN tb.Payment_Status = 'Canceled'
        THEN tb.Booking_ID END)                 AS Canceled_Bookings,
    COALESCE(r.Points, 0)                       AS Reward_Points,
    COALESCE(r.Tier, 'Bronze')                  AS Reward_Tier
FROM Passenger p
LEFT JOIN ticket_booking tb ON p.Passenger_id = tb.Passenger_ID
LEFT JOIN Rewards r         ON p.Passenger_id = r.Passenger_ID
GROUP BY p.Passenger_id, p.Name, p.Email, p.Nationality,
         p.Passport_No, p.Phone_No, r.Points, r.Tier;
