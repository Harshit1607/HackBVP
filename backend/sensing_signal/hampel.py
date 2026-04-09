import numpy as np

def hampel_filter(data: np.ndarray, window_size: int = 10, n_sigma: float = 3.0) -> np.ndarray:
    """Standard Hampel identifier outlier filter."""
    n = len(data)
    filtered = data.copy()
    k = 1.4826
    for i in range(window_size, n - window_size):
        window = data[i - window_size : i + window_size + 1]
        median = np.median(window)
        mad = np.median(np.abs(window - median))
        threshold = n_sigma * k * mad
        if np.abs(data[i] - median) > threshold:
            filtered[i] = median
    return filtered


