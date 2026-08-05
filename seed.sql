-- ============================================================
-- AeroManage — Sample Data Seed File
-- Run this to populate the database with realistic demo data
-- ============================================================

USE airport;

-- ── Airlines ─────────────────────────────────────────────────
INSERT INTO Airline (Name, Country) VALUES
('IndiGo',          'India'),
('Air India',       'India'),
('SpiceJet',        'India'),
('Vistara',         'India'),
('Emirates',        'UAE'),
('Singapore Airlines', 'Singapore');

-- ── Airports ──────────────────────────────────────────────────
INSERT INTO Airport (Name, Code, Location) VALUES
('Indira Gandhi International Airport',  'DEL', 'New Delhi'),
('Chhatrapati Shivaji Maharaj International Airport', 'BOM', 'Mumbai'),
('Kempegowda International Airport',     'BLR', 'Bengaluru'),
('Chennai International Airport',        'MAA', 'Chennai'),
('Rajiv Gandhi International Airport',   'HYD', 'Hyderabad'),
('Netaji Subhas Chandra Bose International Airport', 'CCU', 'Kolkata'),
('Sardar Vallabhbhai Patel International Airport',   'AMD', 'Ahmedabad'),
('Dubai International Airport',          'DXB', 'Dubai'),
('Changi Airport',                       'SIN', 'Singapore');

-- ── Passengers ───────────────────────────────────────────────
INSERT INTO Passenger (Name, Email, Nationality, Passport_No, Phone_No) VALUES
('Aarav Sharma',     'aarav.sharma@gmail.com',     'Indian',   'P1234501', '9876543201'),
('Priya Mehta',      'priya.mehta@gmail.com',      'Indian',   'P1234502', '9876543202'),
('Rohit Verma',      'rohit.verma@outlook.com',    'Indian',   'P1234503', '9876543203'),
('Sneha Iyer',       'sneha.iyer@yahoo.com',       'Indian',   'P1234504', '9876543204'),
('Arjun Nair',       'arjun.nair@gmail.com',       'Indian',   'P1234505', '9876543205'),
('Kavya Reddy',      'kavya.reddy@gmail.com',      'Indian',   'P1234506', '9876543206'),
('Vikram Singh',     'vikram.singh@outlook.com',   'Indian',   'P1234507', '9876543207'),
('Ananya Patel',     'ananya.patel@gmail.com',     'Indian',   'P1234508', '9876543208'),
('Rahul Gupta',      'rahul.gupta@gmail.com',      'Indian',   'P1234509', '9876543209'),
('Divya Krishnan',   'divya.k@gmail.com',          'Indian',   'P1234510', '9876543210'),
('James Mitchell',   'james.m@mail.com',           'British',  'GB123456',  '9876543211'),
('Sarah Johnson',    'sarah.j@mail.com',           'American', 'US987654',  '9876543212');

-- ── Flights ───────────────────────────────────────────────────
INSERT INTO flight (Airline_ID, Source, Destination, Departure_Airport_ID, Arrival_Airport_ID, Departure_Time, Arrival_Time, Status, Available_Seats) VALUES
(1, 'Delhi',     'Mumbai',    1, 2, '2025-08-01 06:00:00', '2025-08-01 08:10:00', 'On-Time',  120),
(2, 'Mumbai',    'Delhi',     2, 1, '2025-08-01 09:30:00', '2025-08-01 11:45:00', 'On-Time',  150),
(3, 'Delhi',     'Bengaluru', 1, 3, '2025-08-01 10:15:00', '2025-08-01 13:00:00', 'Delayed',   80),
(4, 'Bengaluru', 'Chennai',   3, 4, '2025-08-01 11:00:00', '2025-08-01 12:15:00', 'On-Time',  100),
(1, 'Mumbai',    'Hyderabad', 2, 5, '2025-08-01 13:45:00', '2025-08-01 15:30:00', 'On-Time',  110),
(5, 'Delhi',     'Dubai',     1, 8, '2025-08-01 14:00:00', '2025-08-01 17:30:00', 'On-Time',  200),
(6, 'Mumbai',    'Singapore', 2, 9, '2025-08-01 23:55:00', '2025-08-02 10:00:00', 'On-Time',  180),
(2, 'Kolkata',   'Delhi',     6, 1, '2025-08-02 07:00:00', '2025-08-02 09:30:00', 'On-Time',  130),
(3, 'Chennai',   'Mumbai',    4, 2, '2025-08-02 08:45:00', '2025-08-02 11:00:00', 'On-Time',   95),
(1, 'Hyderabad', 'Bengaluru', 5, 3, '2025-08-02 12:00:00', '2025-08-02 13:15:00', 'On-Time',  105),
(4, 'Delhi',     'Kolkata',   1, 6, '2025-08-02 15:30:00', '2025-08-02 18:00:00', 'Delayed',   70),
(2, 'Ahmedabad', 'Delhi',     7, 1, '2025-08-02 16:00:00', '2025-08-02 17:50:00', 'On-Time',  120),
(5, 'Mumbai',    'Dubai',     2, 8, '2025-08-03 02:00:00', '2025-08-03 05:00:00', 'On-Time',  220),
(1, 'Delhi',     'Chennai',   1, 4, '2025-08-03 07:30:00', '2025-08-03 10:15:00', 'On-Time',  140),
(6, 'Delhi',     'Singapore', 1, 9, '2025-08-03 22:30:00', '2025-08-04 09:30:00', 'On-Time',  190);

-- ── Staff ─────────────────────────────────────────────────────
INSERT INTO staff (Name, Role, Assigned_Flight_ID, Contact) VALUES
('Capt. Rajesh Kumar',   'Pilot',        1,  '9000000001'),
('Capt. Sunita Rao',     'Pilot',        2,  '9000000002'),
('Capt. Anil Mehta',     'Pilot',        3,  '9000000003'),
('Capt. Pradeep Singh',  'Pilot',        6,  '9000000004'),
('Capt. Linda Thomas',   'Pilot',        7,  '9000000005'),
('Meena Joshi',          'Cabin Crew',   1,  '9000000006'),
('Ritu Sharma',          'Cabin Crew',   1,  '9000000007'),
('Anjali Kapoor',        'Cabin Crew',   2,  '9000000008'),
('Deepak Verma',         'Cabin Crew',   3,  '9000000009'),
('Pooja Nair',           'Cabin Crew',   6,  '9000000010'),
('Suresh Babu',          'Ground Staff', 1,  '9000000011'),
('Kiran Patel',          'Ground Staff', 2,  '9000000012'),
('Mohan Das',            'Ground Staff', 4,  '9000000013'),
('Ramesh Yadav',         'Ground Staff', 5,  '9000000014'),
('Anita Desai',          'Ground Staff', 7,  '9000000015');

-- ── Ticket Bookings ───────────────────────────────────────────
-- Note: The AwardPointsAfterBooking trigger will auto-create Rewards entries
INSERT INTO ticket_booking (Passenger_ID, Flight_ID, Seat_No, Booking_Date, Payment_Status) VALUES
(1,  1,  '12A', '2025-07-20 10:00:00', 'Paid'),
(1,  6,  '14C', '2025-07-21 11:00:00', 'Paid'),
(1,  14, '10B', '2025-07-22 09:00:00', 'Paid'),
(2,  2,  '22B', '2025-07-18 14:00:00', 'Paid'),
(2,  7,  '31A', '2025-07-19 15:30:00', 'Paid'),
(3,  3,  '5C',  '2025-07-15 08:00:00', 'Paid'),
(3,  11, '9D',  '2025-07-20 16:00:00', 'Pending'),
(4,  4,  '18A', '2025-07-17 12:00:00', 'Paid'),
(4,  9,  '7B',  '2025-07-22 13:00:00', 'Paid'),
(5,  5,  '25C', '2025-07-16 09:30:00', 'Paid'),
(5,  1,  '26D', '2025-07-23 10:00:00', 'Paid'),
(6,  7,  '11B', '2025-07-14 11:00:00', 'Paid'),
(6,  13, '15A', '2025-07-21 12:30:00', 'Paid'),
(7,  6,  '3A',  '2025-07-13 07:00:00', 'Paid'),
(7,  8,  '19C', '2025-07-20 14:00:00', 'Paid'),
(8,  2,  '28B', '2025-07-19 15:00:00', 'Paid'),
(9,  10, '6A',  '2025-07-18 16:00:00', 'Paid'),
(10, 15, '20C', '2025-07-22 17:00:00', 'Paid'),
(11, 6,  '1A',  '2025-07-20 18:00:00', 'Paid'),
(12, 7,  '2B',  '2025-07-21 19:00:00', 'Paid');
