from app import create_app
from utils import socketio

app = create_app()

# For production deployment with gunicorn + eventlet/gevent
# Use: gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 wsgi:app
# Or with socketio: gunicorn --worker-class gevent -w 1 --bind 0.0.0.0:5000 wsgi:app


