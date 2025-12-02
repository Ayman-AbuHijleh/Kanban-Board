from flask_caching import Cache
import os
cache = Cache()

def init_cache(app):
    """
    Initialize cache with optimized settings.
    Falls back to SimpleCache if Redis is not available.
    """
    try:
        # Try Redis first for production performance
        app.config["CACHE_TYPE"] = "RedisCache"
        app.config["CACHE_REDIS_HOST"] = os.getenv("REDIS_HOST", "localhost")
        app.config["CACHE_REDIS_PORT"] = 6379
        app.config["CACHE_REDIS_DB"] = 0
        app.config["CACHE_DEFAULT_TIMEOUT"] = 300  # 5 minutes
        app.config["CACHE_KEY_PREFIX"] = "hotel_booking_"
        
        # Connection pool settings for better performance
        app.config["CACHE_OPTIONS"] = {
            "socket_connect_timeout": 2,
            "socket_timeout": 2,
            "max_connections": 50,
            "retry_on_timeout": True
        }
        
        cache.init_app(app)
        
        # Test Redis connection
        cache.get("test")
        print("✓ Redis cache initialized successfully")
        
    except Exception as e:
        print(f"⚠ Redis not available ({str(e)}), falling back to SimpleCache")
        
        # Fallback to SimpleCache (in-memory)
        app.config["CACHE_TYPE"] = "SimpleCache"
        app.config["CACHE_DEFAULT_TIMEOUT"] = 300
        app.config["CACHE_THRESHOLD"] = 500  # Max items to store
        
        cache.init_app(app)
