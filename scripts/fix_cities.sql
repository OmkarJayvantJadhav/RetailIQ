BEGIN;

CREATE TEMP TABLE valid_locations (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(100)
);

INSERT INTO valid_locations (city, state) VALUES
('Mumbai', 'Maharashtra'), ('Pune', 'Maharashtra'), ('Nagpur', 'Maharashtra'), 
('Thane', 'Maharashtra'), ('Nashik', 'Maharashtra'), ('Aurangabad', 'Maharashtra'), 
('Bengaluru', 'Karnataka'), ('Mysore', 'Karnataka'),
('Delhi', 'Delhi'), ('New Delhi', 'Delhi'),
('Chennai', 'Tamil Nadu'), ('Coimbatore', 'Tamil Nadu'), ('Madurai', 'Tamil Nadu'), 
('Tiruchirappalli', 'Tamil Nadu'), ('Salem', 'Tamil Nadu'),
('Ahmedabad', 'Gujarat'), ('Vadodara', 'Gujarat'), ('Rajkot', 'Gujarat'), ('Gandhinagar', 'Gujarat'),
('Hyderabad', 'Telangana'),
('Lucknow', 'Uttar Pradesh'), ('Kanpur', 'Uttar Pradesh'), ('Ghaziabad', 'Uttar Pradesh'), 
('Agra', 'Uttar Pradesh'), ('Meerut', 'Uttar Pradesh'), ('Varanasi', 'Uttar Pradesh'), 
('Allahabad', 'Uttar Pradesh'), ('Noida', 'Uttar Pradesh'),
('Kolkata', 'West Bengal'),
('Jaipur', 'Rajasthan'), ('Jodhpur', 'Rajasthan'), ('Kota', 'Rajasthan'), ('Bikaner', 'Rajasthan'),
('Thiruvananthapuram', 'Kerala'), ('Kochi', 'Kerala'),
('Faridabad', 'Haryana'), ('Gurgaon', 'Haryana'), ('Rohtak', 'Haryana'),
('Ludhiana', 'Punjab'), ('Amritsar', 'Punjab'), ('Jalandhar', 'Punjab'),
('Indore', 'Madhya Pradesh'), ('Bhopal', 'Madhya Pradesh'), ('Gwalior', 'Madhya Pradesh'), 
('Jabalpur', 'Madhya Pradesh'),
('Visakhapatnam', 'Andhra Pradesh'), ('Vijayawada', 'Andhra Pradesh'),
('Patna', 'Bihar');

-- Map each customer ID pseudo-randomly to one of the 48 valid locations
WITH mapped_customers AS (
    SELECT 
        c.customer_id, 
        v.city, 
        v.state
    FROM customers c
    JOIN valid_locations v ON v.id = (ABS(HASHTEXT(c.first_name || c.last_name)) % 48) + 1
)
UPDATE customers c
SET city = m.city, state = m.state
FROM mapped_customers m
WHERE c.customer_id = m.customer_id;

-- Ensure all orders follow the correct city/state of their customer
WITH mapped_customers AS (
    SELECT customer_id, city, state FROM customers
)
UPDATE orders o
SET shipping_city = m.city, shipping_state = m.state
FROM mapped_customers m
WHERE o.customer_id = m.customer_id;

COMMIT;
