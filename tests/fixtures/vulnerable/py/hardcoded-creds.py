# Test fixture: Hardcoded credentials
# Should trigger: hardcoded-password, aws-credentials
# Note: These are FAKE credentials for testing purposes only

DB_PASSWORD = "postgres123"
API_SECRET = "fake_stripe_test_key_1234567890EXAMPLE"
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

def connect_db():
    return psycopg2.connect(
        host="localhost",
        database="mydb",
        user="postgres",
        password=DB_PASSWORD
    )
