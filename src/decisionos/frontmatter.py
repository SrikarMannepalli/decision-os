"""Split a YAML frontmatter block from a markdown body (ADR-0004)."""

from __future__ import annotations

from dataclasses import dataclass

import yaml

FENCE = "---"


class FrontmatterError(ValueError):
    pass


@dataclass(frozen=True)
class Frontmatter:
    meta: dict
    body_start_line: int  # 1-based line of the raw file where the body begins


def split(text: str) -> Frontmatter | None:
    """Return the parsed block, or None when the file has no frontmatter.

    Raises FrontmatterError when a block is opened but unclosed or is not a
    YAML mapping.
    """
    lines = text.split("\n")
    if lines[0].rstrip("\r") != FENCE:
        return None
    for index in range(1, len(lines)):
        if lines[index].rstrip("\r") == FENCE:
            raw = "\n".join(lines[1:index])
            try:
                meta = yaml.safe_load(raw)
            except yaml.YAMLError as exc:
                raise FrontmatterError(f"invalid YAML frontmatter: {exc}") from exc
            if meta is None:
                meta = {}
            if not isinstance(meta, dict):
                raise FrontmatterError("frontmatter is not a mapping")
            return Frontmatter(meta=meta, body_start_line=index + 2)
    raise FrontmatterError("frontmatter block is not closed")
