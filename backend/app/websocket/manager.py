import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from app.schemas.pitch import PitchDataPoint


class PitchStreamManager:
    """Manages WebSocket connections for pitch streaming"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def stream_pitch_data(self, websocket: WebSocket, duration: float = 10.0):
        """Stream fake pitch data to client"""
        try:
            # Simulate pitch data streaming
            base_frequency = 262.0  # Middle C
            frequencies = [262.0, 294.0, 330.0, 349.0, 392.0, 440.0, 494.0, 523.0]

            current_time = 0.0
            freq_index = 0

            while current_time < duration:
                # Get current frequency
                freq = frequencies[freq_index % len(frequencies)]

                # Create pitch data point
                pitch_data = PitchDataPoint(
                    timestamp=current_time,
                    frequency=freq,
                    confidence=0.92,
                )

                # Send to client
                await websocket.send_json(pitch_data.model_dump())

                # Advance time (100ms intervals)
                current_time += 0.1
                await asyncio.sleep(0.1)

                # Change frequency every 2 seconds
                if int(current_time) % 2 == 0 and int(current_time) % 2 != int(
                    current_time - 0.1
                ):
                    freq_index += 1

        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception as e:
            await websocket.close(code=1011, reason=str(e))
            self.disconnect(websocket)


# Global manager instance
pitch_stream_manager = PitchStreamManager()
