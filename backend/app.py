from dotenv import load_dotenv
import os
load_dotenv()

from flask import Flask
from database import Base, engine
from routes import auth_bp, board_bp, list_bp, card_bp
from config import Config
from flask import jsonify
from utils import init_cache, logger, limiter
from flask_cors import CORS



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Base.metadata.create_all(engine)
    init_cache(app)
    limiter.init_app(app)

    #blueprint registeration
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(board_bp, url_prefix='/api')
    app.register_blueprint(list_bp, url_prefix='/api')
    app.register_blueprint(card_bp, url_prefix='/api')


  
    CORS(app)
   
    

    @app.errorhandler(Exception)
    def handle_general_error(err):
      return jsonify({"error": "Server Error", "message": str(err)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True) 


