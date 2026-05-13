from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import logging

logger = logging.getLogger("teachlearn.websocket")

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        # Push real-time data to all connected clients
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to socket: {e}")

manager = ConnectionManager()

@router.websocket("/ws/community")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for the Community Feed.
    Clients connect here to receive instant updates when new posts are created.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client messages if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
