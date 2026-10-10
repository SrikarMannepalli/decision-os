"""GET /files/{path}: raw, line-numbered corpus content (ADR-0004)."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import FakeAgent, corpus_digest
from decisionos import corpus as corpus_module
from decisionos import frontmatter
from decisionos.main import create_app

KICKOFF = "decisions/2024-01-15-invoice-automation-kickoff.md"


@pytest.fixture
def make_client(tmp_path: Path):
    def _make(files: dict[str, str]) -> tuple[TestClient, Path]:
        root = tmp_path / "corpus"
        for rel, text in files.items():
            target = root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
        root.mkdir(exist_ok=True)
        return TestClient(create_app(agent=FakeAgent(root), corpus=str(root))), root

    return _make


def numbered(n: int) -> str:
    return "".join(f"line {i}\n" for i in range(1, n + 1))


def test_returns_requested_lines_with_one_based_inclusive_numbers(client: TestClient):
    res = client.get(f"/files/{KICKOFF}", params={"start": 3, "end": 4})
    assert res.status_code == 200
    body = res.json()
    assert body["path"] == KICKOFF
    assert (body["start"], body["end"]) == (3, 4)
    assert body["totalLines"] == 6
    assert body["lines"] == [
        {"n": 3, "text": "We committed to invoice automation for Q2. The goal was to cut the"},
        {"n": 4, "text": "3 hours per week the team spent on manual entry. Priya owns the outcome."},
    ]
    assert body["entity"] is None


def test_defaults_to_the_start_of_the_file(client: TestClient):
    body = client.get(f"/files/{KICKOFF}").json()
    assert (body["start"], body["end"]) == (1, 6)
    assert body["lines"][0] == {"n": 1, "text": "# 2024-01-15 — Invoice automation kickoff"}


def test_end_past_the_file_is_clamped(client: TestClient):
    body = client.get(f"/files/{KICKOFF}", params={"start": 5, "end": 400}).json()
    assert (body["start"], body["end"]) == (5, 6)
    assert [line["n"] for line in body["lines"]] == [5, 6]


def test_numbers_count_raw_lines_including_frontmatter(make_client):
    text = "---\nid: maya-chen\nname: Maya\n---\n# Maya\nbody\n"
    client, _ = make_client({"people/maya-chen.md": text})
    lines = client.get("/files/people/maya-chen.md").json()["lines"]
    assert [(line["n"], line["text"]) for line in lines] == [
        (1, "---"),
        (2, "id: maya-chen"),
        (3, "name: Maya"),
        (4, "---"),
        (5, "# Maya"),
        (6, "body"),
    ]


def test_crlf_and_a_missing_trailing_newline_are_handled(make_client):
    client, _ = make_client({"a.md": "one\r\ntwo\nthree"})
    body = client.get("/files/a.md").json()
    assert body["totalLines"] == 3
    assert [line["text"] for line in body["lines"]] == ["one", "two", "three"]


def test_unicode_line_separators_do_not_split_lines(make_client):
    client, _ = make_client({"a.md": "a b\x0cc\nd\n"})
    body = client.get("/files/a.md").json()
    assert body["totalLines"] == 2
    assert body["lines"][0]["text"] == "a b\x0cc"


def test_empty_file_has_no_lines(make_client):
    client, _ = make_client({"empty.md": ""})
    body = client.get("/files/empty.md").json()
    assert body["totalLines"] == 0
    assert body["lines"] == []


def test_entity_is_reported_for_a_structured_file(make_client):
    client, _ = make_client({"people/maya-chen.md": "---\nid: maya-chen\nname: Maya\n---\nbio\n"})
    assert client.get("/files/people/maya-chen.md").json()["entity"] == {
        "kind": "person",
        "id": "maya-chen",
    }


@pytest.mark.parametrize(
    "files, path",
    [
        ({"people/maya-chen.md": "no frontmatter\n"}, "people/maya-chen.md"),
        ({"people/maya-chen.md": "---\nid: someone-else\n---\n"}, "people/maya-chen.md"),
        ({"people/maya-chen.md": "---\nid: [unclosed\n---\n"}, "people/maya-chen.md"),
        ({"notes/maya-chen.md": "---\nid: maya-chen\n---\n"}, "notes/maya-chen.md"),
    ],
)
def test_entity_is_null_when_the_file_is_not_a_valid_entity(make_client, files, path):
    client, _ = make_client(files)
    res = client.get(f"/files/{path}")
    assert res.status_code == 200
    assert res.json()["entity"] is None


def test_missing_file_is_404(client: TestClient):
    assert client.get("/files/decisions/nope.md").status_code == 404


def test_missing_directory_component_is_404(client: TestClient):
    assert client.get("/files/nowhere/nope.md").status_code == 404


@pytest.mark.parametrize(
    "params",
    [
        {"start": 4, "end": 3},
        {"start": 0},
        {"start": -2, "end": 3},
        {"start": 7},
        {"start": "x"},
        {"start": 1, "end": 501},
        {"start": 10, "end": 510},
    ],
)
def test_bad_ranges_are_422(client: TestClient, params):
    assert client.get(f"/files/{KICKOFF}", params=params).status_code == 422


def test_window_of_exactly_500_lines_is_allowed(make_client):
    client, _ = make_client({"big.md": numbered(800)})
    body = client.get("/files/big.md", params={"start": 101, "end": 600}).json()
    assert len(body["lines"]) == 500
    assert (body["start"], body["end"]) == (101, 600)


def test_default_window_is_capped_at_500_lines(make_client):
    client, _ = make_client({"big.md": numbered(800)})
    body = client.get("/files/big.md", params={"start": 10}).json()
    assert (body["start"], body["end"]) == (10, 509)
    assert body["totalLines"] == 800


@pytest.mark.parametrize(
    "path",
    [
        "%2e%2e/secret.md",
        "decisions/%2e%2e/%2e%2e/secret.md",
        "..%2Fsecret.md",
        "%2Fetc%2Fpasswd.md",
        "/etc/passwd.md",
        "decisions%5C..%5Csecret.md",
        "readme.txt",
        "decisions",
        "decisions/",
        "no-extension",
        "a.md%00.txt",
        "a.MD.exe",
    ],
)
def test_unsafe_or_unsupported_paths_are_422(make_client, path):
    client, root = make_client({"a.md": "x\n", "decisions/d.md": "x\n", "readme.txt": "x\n"})
    (root.parent / "secret.md").write_text("top secret\n", encoding="utf-8")
    res = client.get(f"/files/{path}")
    assert res.status_code == 422, res.text
    assert "top secret" not in res.text


@pytest.mark.parametrize("path", ["../secret.md", "decisions/../../secret.md", "decisions/./../../secret.md", "/etc/passwd.md"])
def test_read_slice_rejects_traversal_and_absolute_paths(make_client, path):
    _, root = make_client({"decisions/d.md": "x\n"})
    (root.parent / "secret.md").write_text("top secret\n", encoding="utf-8")
    with pytest.raises(corpus_module.InvalidPath):
        corpus_module.read_slice(root, path)


def test_directory_named_like_a_markdown_file_is_422(make_client):
    client, root = make_client({"a.md": "x\n"})
    (root / "folder.md").mkdir()
    assert client.get("/files/folder.md").status_code == 422


def test_symlink_escaping_the_corpus_is_422(make_client):
    client, root = make_client({"a.md": "x\n"})
    outside = root.parent / "outside.md"
    outside.write_text("top secret\n", encoding="utf-8")
    (root / "link.md").symlink_to(outside)
    res = client.get("/files/link.md")
    assert res.status_code == 422
    assert "top secret" not in res.text


def test_symlinked_directory_escaping_the_corpus_is_422(make_client):
    client, root = make_client({"a.md": "x\n"})
    outside = root.parent / "elsewhere"
    outside.mkdir()
    (outside / "x.md").write_text("top secret\n", encoding="utf-8")
    (root / "linked").symlink_to(outside, target_is_directory=True)
    res = client.get("/files/linked/x.md")
    assert res.status_code == 422
    assert "top secret" not in res.text


def test_symlink_inside_the_corpus_is_served(make_client):
    client, root = make_client({"decisions/d.md": "hello\n"})
    (root / "alias.md").symlink_to(root / "decisions" / "d.md")
    assert client.get("/files/alias.md").json()["lines"] == [{"n": 1, "text": "hello"}]


def test_dangling_symlink_is_404(make_client):
    client, root = make_client({"a.md": "x\n"})
    (root / "dangling.md").symlink_to(root / "gone.md")
    assert client.get("/files/dangling.md").status_code == 404


def test_requests_leave_the_corpus_byte_identical(client: TestClient, corpus: Path):
    before = corpus_digest(corpus)
    files_before = {p.relative_to(corpus) for p in corpus.rglob("*")}
    for path, params in [
        (KICKOFF, {}),
        (KICKOFF, {"start": 2, "end": 3}),
        ("decisions/missing.md", {}),
        ("../x.md", {}),
        (KICKOFF, {"start": 9, "end": 2}),
    ]:
        client.get(f"/files/{path}", params=params)
    assert corpus_digest(corpus) == before
    assert {p.relative_to(corpus) for p in corpus.rglob("*")} == files_before


class TestFrontmatter:
    def test_splits_the_block_and_reports_the_first_body_line(self):
        parsed = frontmatter.split("---\nid: a\ntags: [x, y]\n---\n# Title\n")
        assert parsed is not None
        assert parsed.meta == {"id": "a", "tags": ["x", "y"]}
        assert parsed.body_start_line == 5

    def test_no_block_returns_none(self):
        assert frontmatter.split("# Title\n---\nnot: frontmatter\n---\n") is None

    def test_unclosed_block_is_malformed(self):
        with pytest.raises(frontmatter.FrontmatterError):
            frontmatter.split("---\nid: a\n# never closed\n")

    def test_invalid_yaml_is_malformed(self):
        with pytest.raises(frontmatter.FrontmatterError):
            frontmatter.split("---\nid: [unclosed\n---\n")

    def test_non_mapping_is_malformed(self):
        with pytest.raises(frontmatter.FrontmatterError):
            frontmatter.split("---\n- a\n- b\n---\n")

    def test_empty_block_is_an_empty_mapping(self):
        parsed = frontmatter.split("---\n---\nbody\n")
        assert parsed is not None
        assert parsed.meta == {}
        assert parsed.body_start_line == 3
