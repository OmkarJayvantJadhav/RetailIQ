import psycopg2
import random

correct_locations = [
    ("Mumbai", "Maharashtra"), ("Delhi", "Delhi"), ("Bengaluru", "Karnataka"), 
    ("Hyderabad", "Telangana"), ("Ahmedabad", "Gujarat"), ("Chennai", "Tamil Nadu"), 
    ("Kolkata", "West Bengal"), ("Pune", "Maharashtra"), ("Jaipur", "Rajasthan"), 
    ("Lucknow", "Uttar Pradesh"), ("Kanpur", "Uttar Pradesh"), ("Nagpur", "Maharashtra"), 
    ("Indore", "Madhya Pradesh"), ("Thane", "Maharashtra"), ("Bhopal", "Madhya Pradesh"), 
    ("Visakhapatnam", "Andhra Pradesh"), ("Patna", "Bihar"), ("Vadodara", "Gujarat"), 
    ("Ghaziabad", "Uttar Pradesh"), ("Ludhiana", "Punjab"), ("Agra", "Uttar Pradesh"), 
    ("Nashik", "Maharashtra"), ("Ranchi", "Jharkhand"), ("Faridabad", "Haryana"), 
    ("Meerut", "Uttar Pradesh"), ("Rajkot", "Gujarat"), ("Varanasi", "Uttar Pradesh"), 
    ("Srinagar", "Jammu and Kashmir"), ("Aurangabad", "Maharashtra"), ("Dhanbad", "Jharkhand"), 
    ("Amritsar", "Punjab"), ("Allahabad", "Uttar Pradesh"), ("Gwalior", "Madhya Pradesh"), 
    ("Jabalpur", "Madhya Pradesh"), ("Coimbatore", "Tamil Nadu"), ("Vijayawada", "Andhra Pradesh"), 
    ("Jodhpur", "Rajasthan"), ("Madurai", "Tamil Nadu"), ("Raipur", "Chhattisgarh"), 
    ("Kota", "Rajasthan"), ("Chandigarh", "Chandigarh"), ("Guwahati", "Assam"), 
    ("Solapur", "Maharashtra"), ("Bareilly", "Uttar Pradesh"), ("Mysore", "Karnataka"), 
    ("Gurgaon", "Haryana"), ("Aligarh", "Uttar Pradesh"), ("Jalandhar", "Punjab"), 
    ("Tiruchirappalli", "Tamil Nadu"), ("Bhubaneswar", "Odisha"), ("Salem", "Tamil Nadu"), 
    ("Thiruvananthapuram", "Kerala"), ("Bikaner", "Rajasthan"), ("Noida", "Uttar Pradesh"), 
    ("Jamshedpur", "Jharkhand"), ("Kochi", "Kerala"), ("Dehradun", "Uttarakhand"),
    ("Gandhinagar", "Gujarat"), ("Shimla", "Himachal Pradesh"), ("Rohtak", "Haryana")
]

try:
    # Connect directly assuming this is run inside the postgres container or mapped properly
    # If mapped externally, we use host=localhost, port=5432, user=postgres
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="password",
        database="retailiq_db"
    )
    cur = conn.cursor()

    cur.execute("SELECT customer_id FROM customers;")
    customers = cur.fetchall()

    for (cid,) in customers:
        loc = random.choice(correct_locations)
        cur.execute("UPDATE customers SET city = %s, state = %s WHERE customer_id = %s", (loc[0], loc[1], cid))
        cur.execute("UPDATE orders SET shipping_city = %s, shipping_state = %s WHERE customer_id = %s", (loc[0], loc[1], cid))

    conn.commit()
    cur.close()
    conn.close()
    print("Successfully mapped valid city-state combinations.")
except Exception as e:
    print(f"Error: {e}")
