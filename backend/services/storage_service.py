import os
import json
import uuid

from constants import STORAGE_FOLDER


def _ensure_storage_folder():
    """Create storage directory if it doesn't exist."""
    os.makedirs(STORAGE_FOLDER, exist_ok=True)


def _storage_path(file_id: str) -> str:
    """Return the full path for a given file_id."""
    return os.path.join(STORAGE_FOLDER, f"{file_id}.json")


def result_exists(file_id: str) -> bool:
    """Check whether a cached result exists for the given file_id."""
    return os.path.isfile(_storage_path(file_id))


def save_result(file_id: str, data: object) -> None:
    """Persist analysis result as JSON under storage/{file_id}.json."""
    _ensure_storage_folder()
    with open(_storage_path(file_id), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_result(file_id: str) -> object:
    """Load and return cached analysis result for the given file_id.
    
    Returns None if the file does not exist.
    """
    path = _storage_path(file_id)
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_file_id() -> str:
    """Generate a new unique file_id (UUID4)."""
    return str(uuid.uuid4())
