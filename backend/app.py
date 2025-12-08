from dotenv import load_dotenv
import os
load_dotenv()

from flask import Flask
from database import Base, engine
from routes import auth_bp, board_bp, list_bp, card_bp, label_bp, comment_bp
from config import Config
from flask import jsonify
from utils import init_cache, logger, limiter, socketio
from flask_cors import CORS



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Base.metadata.create_all(engine)
    
    # Initialize CORS before SocketIO
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    init_cache(app)
    limiter.init_app(app)
    
    # Initialize SocketIO after CORS
    # In production, Gunicorn with eventlet worker handles async_mode automatically
    socketio.init_app(
        app, 
        cors_allowed_origins="*",
        async_mode='eventlet',  # Explicitly set for production
        engineio_logger=False,
        logger=False
    )

    #blueprint registeration
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(board_bp, url_prefix='/api')
    app.register_blueprint(list_bp, url_prefix='/api')
    app.register_blueprint(card_bp, url_prefix='/api')
    app.register_blueprint(label_bp, url_prefix='/api')
    app.register_blueprint(comment_bp, url_prefix='/api')

    @app.errorhandler(Exception)
    def handle_general_error(err):
      return jsonify({"error": "Server Error", "message": str(err)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True) 


