-- ============================================================
-- Airport Management System
-- Stored Procedures & Triggers
-- ============================================================

USE airport;

-- ============================================================
-- AUDIT TABLE (required by triggers 3 & 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS flight_audit (
    Audit_ID    INT AUTO_INCREMENT PRIMARY KEY,
    Flight_ID   INT          NOT NULL,
    Action      VARCHAR(100) NOT NULL,
    Changed_At  DATETIME     NOT NULL DEFAULT NOW(),
    INDEX idx_audit_flight (Flight_ID)
);

-- ============================================================
-- TRIGGERS
-- ============================================================
DELIMITER $$

-- 1. AFTER INSERT on ticket_booking
--    Auto-decrement available seats + award 100 reward points
DROP TRIGGER IF EXISTS trg_after_booking_insert$$
CREATE TRIGGER trg_after_booking_insert
AFTER INSERT ON ticket_booking
FOR EACH ROW
BEGIN
    UPDATE flight
    SET    Available_Seats = Available_Seats - 1
    WHERE  Flight_ID = NEW.Flight_ID;

    IF NEW.Payment_Status = 'Paid' THEN
        INSERT INTO rewards (Passenger_ID, Points, Tier)
        VALUES (NEW.Passenger_ID, 100, 'Bronze')
        ON DUPLICATE KEY UPDATE
            Points = Points + 100,
            Tier   = CASE
                         WHEN Points + 100 >= 1000 THEN 'Gold'
                         WHEN Points + 100 >= 500  THEN 'Silver'
                         ELSE 'Bronze'
                     END;
    END IF;
END$$

-- 2. AFTER UPDATE on ticket_booking
--    If cancelled: restore seat + deduct points
--    If Pending -> Paid: award points
DROP TRIGGER IF EXISTS trg_after_booking_update$$
CREATE TRIGGER trg_after_booking_update
AFTER UPDATE ON ticket_booking
FOR EACH ROW
BEGIN
    IF NEW.Payment_Status = 'Canceled' AND OLD.Payment_Status != 'Canceled' THEN
        UPDATE flight
        SET    Available_Seats = Available_Seats + 1
        WHERE  Flight_ID = NEW.Flight_ID;

        UPDATE rewards
        SET    Points = GREATEST(Points - 100, 0),
               Tier   = CASE
                            WHEN GREATEST(Points - 100, 0) >= 1000 THEN 'Gold'
                            WHEN GREATEST(Points - 100, 0) >= 500  THEN 'Silver'
                            ELSE 'Bronze'
                        END
        WHERE  Passenger_ID = NEW.Passenger_ID;
    END IF;

    IF NEW.Payment_Status = 'Paid' AND OLD.Payment_Status = 'Pending' THEN
        INSERT INTO rewards (Passenger_ID, Points, Tier)
        VALUES (NEW.Passenger_ID, 100, 'Bronze')
        ON DUPLICATE KEY UPDATE
            Points = Points + 100,
            Tier   = CASE
                         WHEN Points + 100 >= 1000 THEN 'Gold'
                         WHEN Points + 100 >= 500  THEN 'Silver'
                         ELSE 'Bronze'
                     END;
    END IF;
END$$

-- 3. AFTER INSERT on flight — audit log
DROP TRIGGER IF EXISTS trg_after_flight_insert$$
CREATE TRIGGER trg_after_flight_insert
AFTER INSERT ON flight
FOR EACH ROW
BEGIN
    INSERT INTO flight_audit (Flight_ID, Action, Changed_At)
    VALUES (NEW.Flight_ID, 'CREATED', NOW());
END$$

-- 4. AFTER UPDATE on flight — log status changes
DROP TRIGGER IF EXISTS trg_after_flight_status_update$$
CREATE TRIGGER trg_after_flight_status_update
AFTER UPDATE ON flight
FOR EACH ROW
BEGIN
    IF NEW.Status != OLD.Status THEN
        INSERT INTO flight_audit (Flight_ID, Action, Changed_At)
        VALUES (NEW.Flight_ID,
                CONCAT('STATUS: ', OLD.Status, ' -> ', NEW.Status),
                NOW());
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================
DELIMITER $$

-- 1. sp_BookTicket: safe booking with all checks
DROP PROCEDURE IF EXISTS sp_BookTicket$$
CREATE PROCEDURE sp_BookTicket(
    IN  p_passenger_id   INT,
    IN  p_flight_id      INT,
    IN  p_seat_no        VARCHAR(10),
    IN  p_payment_status VARCHAR(20),
    OUT p_booking_id     INT,
    OUT p_error          VARCHAR(200)
)
BEGIN
    DECLARE v_available  INT DEFAULT 0;
    DECLARE v_seat_taken INT DEFAULT 0;
    SET p_booking_id = 0;
    SET p_error      = '';

    SELECT Available_Seats INTO v_available
    FROM   flight WHERE Flight_ID = p_flight_id;

    IF v_available <= 0 THEN
        SET p_error = 'Flight is fully booked.';
    ELSE
        SELECT COUNT(*) INTO v_seat_taken
        FROM   ticket_booking
        WHERE  Flight_ID = p_flight_id AND Seat_No = p_seat_no
          AND  Payment_Status != 'Canceled';

        IF v_seat_taken > 0 THEN
            SET p_error = CONCAT('Seat ', p_seat_no, ' is already taken.');
        ELSE
            INSERT INTO ticket_booking (Passenger_ID, Flight_ID, Seat_No, Payment_Status)
            VALUES (p_passenger_id, p_flight_id, p_seat_no, p_payment_status);
            SET p_booking_id = LAST_INSERT_ID();
        END IF;
    END IF;
END$$

-- 2. sp_GetPassengerReport: full passenger profile
DROP PROCEDURE IF EXISTS sp_GetPassengerReport$$
CREATE PROCEDURE sp_GetPassengerReport(IN p_passenger_id INT)
BEGIN
    SELECT p.Passenger_id, p.Name, p.Email, p.Nationality, p.Passport_No,
           COUNT(tb.Booking_ID)                                          AS Total_Bookings,
           SUM(CASE WHEN tb.Payment_Status='Paid'     THEN 1 ELSE 0 END) AS Paid,
           SUM(CASE WHEN tb.Payment_Status='Pending'  THEN 1 ELSE 0 END) AS Pending,
           SUM(CASE WHEN tb.Payment_Status='Canceled' THEN 1 ELSE 0 END) AS Canceled,
           COALESCE(r.Points, 0)                                         AS Reward_Points,
           COALESCE(r.Tier,  'Bronze')                                   AS Tier
    FROM   Passenger p
    LEFT JOIN ticket_booking tb ON p.Passenger_id = tb.Passenger_ID
    LEFT JOIN rewards         r  ON p.Passenger_id = r.Passenger_ID
    WHERE  p.Passenger_id = p_passenger_id
    GROUP  BY p.Passenger_id, r.Points, r.Tier;

    SELECT tb.Booking_ID, tb.Flight_ID, tb.Seat_No, tb.Payment_Status, tb.Booking_Date
    FROM   ticket_booking tb
    WHERE  tb.Passenger_ID = p_passenger_id
    ORDER  BY tb.Booking_Date DESC;
END$$

-- 3. sp_FlightOccupancyReport: occupancy % for every flight
DROP PROCEDURE IF EXISTS sp_FlightOccupancyReport$$
CREATE PROCEDURE sp_FlightOccupancyReport()
BEGIN
    SELECT f.Flight_ID,
           f.Source, f.Destination,
           f.Total_Seats,
           f.Available_Seats,
           (f.Total_Seats - f.Available_Seats)                           AS Booked_Seats,
           ROUND(((f.Total_Seats - f.Available_Seats)/f.Total_Seats)*100, 1) AS Occupancy_Pct,
           f.Status
    FROM   flight f
    ORDER  BY Occupancy_Pct DESC;
END$$

-- 4. sp_CancelBooking: safe cancellation
DROP PROCEDURE IF EXISTS sp_CancelBooking$$
CREATE PROCEDURE sp_CancelBooking(
    IN  p_booking_id   INT,
    IN  p_passenger_id INT,
    OUT p_success      TINYINT,
    OUT p_message      VARCHAR(200)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM   ticket_booking
    WHERE  Booking_ID   = p_booking_id
      AND  Passenger_ID = p_passenger_id
      AND  Payment_Status != 'Canceled';

    IF v_exists = 0 THEN
        SET p_success = 0;
        SET p_message = 'Booking not found or already cancelled.';
    ELSE
        UPDATE ticket_booking
        SET    Payment_Status = 'Canceled'
        WHERE  Booking_ID = p_booking_id;
        SET p_success = 1;
        SET p_message = CONCAT('Booking #', p_booking_id, ' cancelled successfully.');
    END IF;
END$$

DELIMITER ;

-- Quick verification
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'airport';
