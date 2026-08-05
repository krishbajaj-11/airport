-- ============================================================
-- Airport Management System - Database Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS Airline (
    Airline_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Country VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Airport (
    Airport_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Code VARCHAR(10),
    Location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Passenger (
    Passenger_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(100),
    Nationality VARCHAR(50),
    Passport_No VARCHAR(50),
    Phone_No VARCHAR(15) UNIQUE
);

CREATE TABLE IF NOT EXISTS flight (
    Flight_ID INT AUTO_INCREMENT PRIMARY KEY,
    Airline_ID INT NOT NULL,
    Source VARCHAR(100) NOT NULL,
    Destination VARCHAR(100) NOT NULL,
    Departure_Airport_ID INT NOT NULL,
    Arrival_Airport_ID INT NOT NULL,
    Departure_Time DATETIME NOT NULL,
    Arrival_Time DATETIME NOT NULL,
    Available_Seats INT DEFAULT 100,
    Status ENUM('On-Time', 'Delayed', 'Canceled') DEFAULT 'On-Time',
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_id) ON DELETE CASCADE,
    FOREIGN KEY (Departure_Airport_ID) REFERENCES Airport(Airport_id) ON DELETE CASCADE,
    FOREIGN KEY (Arrival_Airport_ID) REFERENCES Airport(Airport_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
    Staff_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role ENUM('Pilot', 'Cabin Crew', 'Ground Staff') NOT NULL,
    Assigned_Flight_ID INT,
    Contact VARCHAR(15),
    FOREIGN KEY (Assigned_Flight_ID) REFERENCES flight(Flight_ID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin (
    Admin_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Super Admin', 'Manager') NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT NOT NULL,
    Flight_ID INT NOT NULL,
    Seat_No VARCHAR(10),
    Booking_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Payment_Status ENUM('Paid', 'Pending', 'Canceled') DEFAULT 'Pending',
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (Flight_ID) REFERENCES flight(Flight_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT,
    Flight_ID INT,
    Message TEXT,
    Notification_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id),
    FOREIGN KEY (Flight_ID) REFERENCES flight(Flight_ID)
);

CREATE TABLE IF NOT EXISTS Rewards (
    Reward_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT NOT NULL UNIQUE,
    Points INT DEFAULT 0,
    Tier ENUM('Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Bronze',
    Last_Updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id) ON DELETE CASCADE
);
