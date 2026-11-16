import os

# Importing app.main constructs the ASGI app. Use a dedicated public test key.
os.environ["PE_JWT_SECRET"] = "test-only-jwt-key-for-riff-battle-0123456789"
