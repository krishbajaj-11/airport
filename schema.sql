-- ============================================================
-- Airport Management System - Database Schema
-- ============================================================

-- Core Tables

CREATE TABLE Airline (
    Airline_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Country VARCHAR(50)
);

CREATE TABLE Airport (
    Airport_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Code VARCHAR(10),
    Location VARCHAR(100)
);

CREATE TABLE Passenger (
    Passenger_id INT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(100),
    Nationality VARCHAR(50),
    Passport_No VARCHAR(50),
    Phone_No VARCHAR(15) UNIQUE
);

CREATE TABLE flight (
    Flight_ID INT AUTO_INCREMENT PRIMARY KEY,
    Airline_ID INT NOT NULL,
    Source VARCHAR(100) NOT NULL,
    Destination VARCHAR(100) NOT NULL,
    Departure_Airport_ID INT NOT NULL,
    Arrival_Airport_ID INT NOT NULL,
    Departure_Time DATETIME NOT NULL,
    Arrival_Time DATETIME NOT NULL,
    Status ENUM('On-Time', 'Delayed', 'Canceled') DEFAULT 'On-Time',
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_id) ON DELETE CASCADE,
    FOREIGN KEY (Departure_Airport_ID) REFERENCES Airport(Airport_id) ON DELETE CASCADE,
    FOREIGN KEY (Arrival_Airport_ID) REFERENCES Airport(Airport_id) ON DELETE CASCADE
);

CREATE TABLE staff (
    Staff_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role ENUM('Pilot', 'Cabin Crew', 'Ground Staff') NOT NULL,
    Assigned_Flight_ID INT,
    Contact VARCHAR(15),
    FOREIGN KEY (Assigned_Flight_ID) REFERENCES flight(Flight_ID) ON DELETE SET NULL
);

CREATE TABLE admin (
    Admin_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Super Admin', 'Manager') NOT NULL
);

CREATE TABLE ticket_booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT NOT NULL,
    Flight_ID INT NOT NULL,
    Seat_No VARCHAR(10),
    Booking_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Payment_Status ENUM('Paid', 'Pending', 'Canceled') DEFAULT 'Pending',
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (Flight_ID) REFERENCES flight(Flight_ID) ON DELETE CASCADE
);

CREATE TABLE Notifications (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT,
    Flight_ID INT,
    Message TEXT,
    Notification_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id),
    FOREIGN KEY (Flight_ID) REFERENCES flight(Flight_ID)
);

CREATE TABLE Rewards (
    Reward_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_ID INT NOT NULL UNIQUE,
    Points INT DEFAULT 0,
    Tier ENUM('Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Bronze',
    Last_Updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_id) ON DELETE CASCADE
);

-- ============================================================
-- Triggers
-- ============================================================

DELIMITER $$

-- Trigger: Award 100 points after a paid booking
CREATE TRIGGER AwardPointsAfterBooking
AFTER INSERT ON ticket_booking
FOR EACH ROW
BEGIN
    DECLARE reward_exists INT DEFAULT 0;

    -- Check if the passenger already has a reward account
    SELECT COUNT(*) INTO reward_exists
    FROM Rewards
    WHERE Passenger_ID = NEW.Passenger_ID;

    -- If not, create a new reward entry
    IF reward_exists = 0 THEN
        INSERT INTO Rewards (Passenger_ID, Points)
        VALUES (NEW.Passenger_ID, 0);
    END IF;

    -- If booking is paid, award 100 points
    IF NEW.Payment_Status = 'Paid' THEN
        UPDATE Rewards
        SET Points = Points + 100
        WHERE Passenger_ID = NEW.Passenger_ID;

        -- Update tier based on points
        UPDATE Rewards
        SET Tier = CASE
            WHEN Points >= 10000 THEN 'Platinum'
            WHEN Points >= 5000 THEN 'Gold'
            WHEN Points >= 1000 THEN 'Silver'
            ELSE 'Bronze'
        END
        WHERE Passenger_ID = NEW.Passenger_ID;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- Stored Procedures
-- ============================================================

CREATE DEFINER=`root`@`localhost` PROCEDURE `Safe_Ticket_Booking`(
    IN p_Passenger_ID INT,
    IN p_Flight_ID INT,
    IN p_Seat_No VARCHAR(10)
)
BEGIN
    DECLARE seats_available INT;
    DECLARE reward_exists INT DEFAULT 0;

    SELECT Available_Seats INTO seats_available
    FROM flight
    WHERE Flight_ID = p_Flight_ID;

    IF seats_available > 0 THEN
        INSERT INTO ticket_booking (Passenger_ID, Flight_ID, Seat_No, Payment_Status)
        VALUES (p_Passenger_ID, p_Flight_ID, p_Seat_No, 'Paid');

        UPDATE flight
        SET Available_Seats = Available_Seats - 1
        WHERE Flight_ID = p_Flight_ID;

        SELECT COUNT(*) INTO reward_exists
        FROM Rewards
        WHERE Passenger_ID = p_Passenger_ID;

        IF reward_exists = 0 THEN
            INSERT INTO Rewards (Passenger_ID, Points)
            VALUES (p_Passenger_ID, 0);
        END IF;

        UPDATE Rewards
        SET Points = Points + 100
        WHERE Passenger_ID = p_Passenger_ID;

        UPDATE Rewards
        SET Tier = CASE
            WHEN Points >= 10000 THEN 'Platinum'
            WHEN Points >= 5000 THEN 'Gold'
            WHEN Points >= 1000 THEN 'Silver'
            ELSE 'Bronze'
        END
        WHERE Passenger_ID = p_Passenger_ID;

        SELECT 'Booking successful! Rewards updated.' AS Message;
    ELSE
        SELECT 'Booking failed: No available seats.' AS Message;
    END IF;
END

DELIMITER $$

-- Trigger: Notify passengers when a flight is Delayed or Canceled
CREATE TRIGGER Notify_Passengers_On_Status_Change
AFTER UPDATE ON flight
FOR EACH ROW
BEGIN
    -- Check if Status is changed to 'Delayed' or 'Canceled'
    IF (NEW.Status IN ('Delayed', 'Canceled')) THEN

        -- Insert a notification for every passenger booked on this flight
        INSERT INTO Notifications (Passenger_ID, Flight_ID, Message)
        SELECT
            Passenger_ID,
            NEW.Flight_ID,
            CONCAT('Your flight ', NEW.Flight_ID, ' is now ', NEW.Status, '. Please check updates.')
        FROM
            ticket_booking
        WHERE
            Flight_ID = NEW.Flight_ID;
    END IF;
END$$

DELIMITER ;
