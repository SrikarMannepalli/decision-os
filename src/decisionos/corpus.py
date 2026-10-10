"""Read-only access to corpus files (ADR-0003, ADR-0004).

Line numbers count lines of the raw file, frontmatter included, so they match
the retrieval agent's citations. Nothing here writes to the corpus.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from . import frontmatter

log = logging.getLogger(__name__)

MAX_WINDOW = 500

ENTITY_KINDS = {
    "people": "person",
    "projects": "project",
    "documents": "document",
    "decisions": "decision",
}


class CorpusError(Exception):
    pass


class InvalidPath(CorpusError):
    """The path escapes the corpus, is absolute, is not markdown, or is a directory."""


class InvalidRange(CorpusError):
    pass


class FileNotFound(CorpusError):
    pass


@dataclass(frozen=True)
class Slice:
    path: str
    start: int
    end: int
    total_lines: int
    lines: tuple[tuple[int, str], ...]
    entity: tuple[str, str] | None

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "start": self.start,
            "end": self.end,
            "totalLines": self.total_lines,
            "lines": [{"n": n, "text": text} for n, text in self.lines],
            "entity": None if self.entity is None else {"kind": self.entity[0], "id": self.entity[1]},
        }


def _resolve(corpus: Path, path: str) -> Path:
    if not path or "\x00" in path or "\\" in path:
        raise InvalidPath("invalid path")
    if path.startswith("/"):
        raise InvalidPath("path must be relative to the corpus")
    parts = PurePosixPath(path).parts
    if ".." in parts:
        raise InvalidPath("path must stay inside the corpus")
    if path.endswith("/") or PurePosixPath(path).suffix != ".md":
        raise InvalidPath("only .md files can be read")

    root = corpus.resolve()
    target = (root / path).resolve()
    if not target.is_relative_to(root):
        raise InvalidPath("path must stay inside the corpus")
    if target.is_dir():
        raise InvalidPath("path is a directory")
    if not target.is_file():
        raise FileNotFound(path)
    return target


def _split_lines(text: str) -> list[str]:
    # Only \n ends a line, as in the agent's `read`; splitlines() also splits on form feed and U+2028.
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    return [line.removesuffix("\r") for line in lines]


def _entity(path: str, text: str) -> tuple[str, str] | None:
    parts = PurePosixPath(path).parts
    if len(parts) != 2 or parts[0] not in ENTITY_KINDS:
        return None
    try:
        parsed = frontmatter.split(text)
    except frontmatter.FrontmatterError as exc:
        log.warning("skipping malformed entity file %s: %s", path, exc)
        return None
    entity_id = parsed.meta.get("id") if parsed else None
    if not isinstance(entity_id, str) or entity_id != PurePosixPath(path).stem:
        return None
    return ENTITY_KINDS[parts[0]], entity_id


def read_slice(corpus: Path, path: str, start: int = 1, end: int | None = None) -> Slice:
    if start < 1:
        raise InvalidRange("start must be at least 1")
    if end is None:
        end = start + MAX_WINDOW - 1
    if end < start:
        raise InvalidRange("start must not be after end")
    if end - start + 1 > MAX_WINDOW:
        raise InvalidRange(f"a window may cover at most {MAX_WINDOW} lines")

    target = _resolve(corpus, path)
    text = target.read_bytes().decode("utf-8", errors="replace")
    lines = _split_lines(text)
    total = len(lines)
    if start > max(total, 1):
        raise InvalidRange("start is past the end of the file")

    end = min(end, total)
    window = tuple((n, lines[n - 1]) for n in range(start, end + 1))
    return Slice(path, start, end, total, window, _entity(path, text))
