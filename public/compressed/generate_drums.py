
from dataclasses import dataclass, field
from typing import List, Dict, Optional
import xml.etree.ElementTree as ET
from pathlib import Path
import json

@dataclass
class Sound:
    id: str
    type: Optional[int] = None
    variants: List[str] = field(default_factory=list)

@dataclass
class Drum:
    id: str
    sounds: Dict[str, Sound] = field(default_factory=dict)

    def add_sound(self, sound: Sound) -> None:
        self.sounds[sound.id] = sound

def _resolve_include_path(include_value: str, base_dir: Path) -> Path:
    """
    Resolve an <Include> path relative to base_dir. If it doesn't exist, fall back to
    finding a file with the same basename in base_dir (helpful when folder structure differs).
    """
    candidate = (base_dir / include_value).resolve()
    if candidate.exists():
        return candidate

    # Fallback: try same basename in base_dir
    alt = (base_dir / Path(include_value).name).resolve()
    if alt.exists():
        return alt

    raise FileNotFoundError(f"Included file not found: {include_value} (searched {candidate} and {alt})")

def _parse_drum_element(dir: Path, elem: ET.Element) -> Drum:
    drum_id = elem.attrib.get("id")
    if not drum_id:
        raise ValueError("<Drum> element missing required 'id' attribute")

    drum = Drum(id=drum_id)

    for s in elem.findall("Sound"):
        sound_id = s.attrib.get("id")
        if not sound_id:
            raise ValueError("<Sound> element missing required 'id' attribute")

        type_attr = s.attrib.get("type")
        type_int = int(type_attr) if type_attr is not None and type_attr != "" else None

        variants = [str(dir / v.text.strip()) for v in s.findall("Variant") if v.text and v.text.strip()]

        drum.add_sound(Sound(id=sound_id, type=type_int, variants=variants))

    return drum

def _parse_assets_file(path: Path) -> List[Drum]:
    """
    Parse a single XML file that may contain:
      - zero or more <Include> elements
      - zero or more <Drum> elements
    Returns a list of Drum objects.
    """
    base_dir = path.parent
    tree = ET.parse(path)
    root = tree.getroot()

    drums: Dict[str, Drum] = {}

    # 1) Handle <Include> first so included drums can be overridden by local definition if needed
    for inc in root.findall("Include"):
        if inc.text and inc.text.strip():
            inc_path = _resolve_include_path(inc.text.strip(), base_dir)
            for d in _parse_assets_file(inc_path):
                drums[d.id] = d

    rel_path = path.parent.relative_to(Path.cwd().parent)
    # 2) Handle local <Drum> definitions
    for d_elem in root.findall("Drum"):
        d = _parse_drum_element(rel_path, d_elem)
        drums[d.id] = d

    return list(drums.values())

def load_assets(xml_path: str | Path) -> List[Drum]:
    """
    High-level helper to load all drums from the given top-level assets XML path.
    """
    xml_path = Path(xml_path).resolve()
    return _parse_assets_file(xml_path)

if __name__ == "__main__":
    # Small CLI preview: print a concise JSON summary for quick inspection
    drums = load_assets("assets.xml")
    as_json = dict()
    for d in drums:
        as_json[d.id] = {
            "sounds": { s.id:
                {
                    "type": s.type,
                    "variants": s.variants,
                }
                for s in d.sounds.values()
            },
        }
        
    with open("assets.json", "w+") as f:
        f.write(json.dumps(as_json, indent=4))
