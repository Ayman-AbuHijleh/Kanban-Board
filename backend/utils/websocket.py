from flask_socketio import SocketIO, emit, join_room, leave_room
from functools import wraps
from flask import request
import jwt
from config import Config
from models import User, Board, BoardMember
from database import Session
import uuid

# Create SocketIO instance - will be initialized with app in app.py
socketio = SocketIO(logger=False, engineio_logger=False)

# Store active connections: {user_id: {socket_id: set_of_board_ids}}
user_connections = {}


def authenticated_only(f):
    """Decorator to require authentication for socket events"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return {'error': 'Authentication required'}, 401
        
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user_uuid = uuid.UUID(data["user_id"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
            return {'error': 'Invalid or expired token'}, 401
        
        session = Session()
        user = session.query(User).get(user_uuid)
        session.close()
        
        if not user:
            return {'error': 'User not found'}, 401
        
        request.current_user = user
        return f(*args, **kwargs)
    
    return wrapped


def board_member_only(f):
    """Decorator to verify user is a member of the board"""
    @wraps(f)
    def wrapped(data, *args, **kwargs):
        if not hasattr(request, 'current_user'):
            return {'error': 'Authentication required'}, 401
        
        board_id = data.get('board_id')
        if not board_id:
            return {'error': 'board_id is required'}, 400
        
        try:
            board_uuid = uuid.UUID(board_id)
        except ValueError:
            return {'error': 'Invalid board_id format'}, 400
        
        session = Session()
        board = session.query(Board).filter_by(board_id=board_uuid).first()
        
        if not board:
            session.close()
            return {'error': 'Board not found'}, 404
        
        # Check if user is owner or member
        is_owner = board.owner_id == request.current_user.user_id
        is_member = session.query(BoardMember).filter_by(
            board_id=board_uuid,
            user_id=request.current_user.user_id
        ).first() is not None
        
        session.close()
        
        if not (is_owner or is_member):
            return {'error': 'Access denied'}, 403
        
        return f(data, *args, **kwargs)
    
    return wrapped


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    # Clean up user connections
    for user_id, connections in list(user_connections.items()):
        if request.sid in connections:
            del connections[request.sid]
            if not connections:
                del user_connections[user_id]


@socketio.on('join_board')
@authenticated_only
@board_member_only
def handle_join_board(data):
    """Join a board room to receive real-time updates"""
    board_id = data.get('board_id')
    room = f"board_{board_id}"
    join_room(room)
    
    # Track user connection
    user_id = str(request.current_user.user_id)
    if user_id not in user_connections:
        user_connections[user_id] = {}
    if request.sid not in user_connections[user_id]:
        user_connections[user_id][request.sid] = set()
    user_connections[user_id][request.sid].add(board_id)
    
    print(f"User {user_id} joined board {board_id}")
    emit('joined_board', {'board_id': board_id, 'status': 'success'})


@socketio.on('leave_board')
@authenticated_only
def handle_leave_board(data):
    """Leave a board room"""
    board_id = data.get('board_id')
    room = f"board_{board_id}"
    leave_room(room)
    
    # Update user connections
    user_id = str(request.current_user.user_id)
    if user_id in user_connections and request.sid in user_connections[user_id]:
        user_connections[user_id][request.sid].discard(board_id)
    
    print(f"User {user_id} left board {board_id}")
    emit('left_board', {'board_id': board_id, 'status': 'success'})


def emit_to_board(board_id, event, data, include_self=True):
    """
    Emit an event to all users in a board room
    
    Args:
        board_id: UUID of the board
        event: Event name
        data: Data to send
        include_self: Whether to include the current request sender (always True for REST API calls)
    """
    room = f"board_{str(board_id)}"
    try:
        socketio.emit(event, data, room=room, include_self=include_self)
    except Exception as e:
        # If emit fails (e.g., no active connections), just log and continue
        # This ensures REST API still works even if WebSocket is down
        print(f"WebSocket emit failed (this is OK if no clients connected): {e}")
