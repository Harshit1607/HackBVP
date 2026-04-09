from abc import ABC, abstractmethod
from typing import AsyncGenerator
from .types import CSIFrame

class CSISource(ABC):
    """Abstraction for any source yielding WiFi frames."""
    @abstractmethod
    async def stream(self) -> AsyncGenerator[CSIFrame, None]:
        """Async generator yielding CSIFrame objects indefinitely."""
        ...

    async def close(self):
        """Optional cleanup. Called when source is switched or server shuts down."""
        pass


class SignalProcessor(ABC):
    """Pipeline component for computing features from raw CSI."""
    @abstractmethod
    def process(self, frame: CSIFrame) -> dict:
        """Return a dict of processed features from a raw CSIFrame."""
        ...


class InferenceModel(ABC):
    """Predictive component producing high-level results like presence or vitals."""
    @abstractmethod
    def predict(self, features: dict) -> dict:
        """Return model predictions from processed features."""
        ...




