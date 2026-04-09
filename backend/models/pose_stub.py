from core.interfaces import InferenceModel

class PoseStub(InferenceModel):
    """Placeholder — returns None until hardware + trained model are available."""
    def predict(self, features: dict) -> dict:
        """Returns None keypoints for now."""
        return {"keypoints": None}




