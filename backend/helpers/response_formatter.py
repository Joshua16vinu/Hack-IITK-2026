import re
from typing import Any
 
def extract_json(text: str) -> str | None:
    match = re.search(r'\[[\s\S]*\]|\{[\s\S]*\}', text)
    return match.group(0) if match else None

def is_valid_gaps(data: Any) -> bool:
    return (
        isinstance(data, list)
    )
    
