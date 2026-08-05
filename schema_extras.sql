-- ============================================================
-- AeroManage — Advanced SQL Features
-- Views, Indexes, and Analytics
-- ============================================================

USE airport;

-- ── Indexes (Performance) ─────────────────────────────────────
-- These speed up the most common queries

CREATE INDEX idx_passenger_email    ON Passenger(Email);
CREATE INDEX idx_passenger_passport ON Passenger(Passport_No);
CREATE INDEX idx_ticket_passenger   ON ticket_booking(Passenger_ID);
CREATE INDEX idx_ticket_flight      ON ticket_booking(Flight_ID);
CREATE INDEX idx_ticket_status      ON ticket_booking(Payment_Status);
CREATE INDEX idx_flight_status      ON flight(Status);
CREATE INDEX idx_flight_source_dest ON flight(Source, Destination);
CREATE INDEX idx_flight_dep_time    ON flight(Departure_Time);

-- ── View 1: Flight Occupancy ──────────────────────────────────
-- Shows how full each flight is as a percentage

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

-- ── View 2: Revenue by Airline ────────────────────────────────
-- Total paid bookings per airline (100 per paid ticket)

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

-- ── View 3: Route Popularity ──────────────────────────────────
-- Most booked source→destination pairs

CREATE OR REPLACE VIEW vw_RoutePopularity AS
SELECT
    f.Source,
    f.Destination,
    CONCAT(f.Source, ' → ', f.Destination)     AS Route,
    COUNT(DISTINCT f.Flight_ID)                 AS Total_Flights,
    COUNT(tb.Booking_ID)                        AS Total_Bookings,
    SUM(CASE WHEN tb.Payment_Status='Paid'
        THEN 1 ELSE 0 END)                      AS Confirmed_Bookings,
    ROUND(AVG(f.Available_Seats), 0)            AS Avg_Available_Seats
FROM flight f
LEFT JOIN ticket_booking tb ON f.Flight_ID = tb.Flight_ID
GROUP BY f.Source, f.Destination
ORDER BY Total_Bookings DESC;

-- ── View 4: Top Passengers ────────────────────────────────────
-- Passengers ranked by loyalty points (uses window function)

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

-- ── View 5: Passenger Full Profile ───────────────────────────
-- Complete passenger info with booking and rewards summary

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
