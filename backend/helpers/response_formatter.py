import re
from typing import Any
 
def extract_json(text: str) -> str | None:
    match = re.search(r'\[[\s\S]*\]|\{[\s\S]*\}', text)
    return match.group(0) if match else None

def is_valid_gaps(data: Any) -> bool:
    if not isinstance(data, list):
        return False
    if len(data) > 5:
        del data[5:]
    return all(isinstance(item, str) and item.strip() for item in data)
    
