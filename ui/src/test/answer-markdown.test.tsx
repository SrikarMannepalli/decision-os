import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AnswerMarkdown } from "@/components/AnswerMarkdown";

// RichText needs the catalog and UI providers; here it just marks the text it would linkify.
vi.mock("@/components/RichText", () => ({ RichText: ({ text }: { text: string }) => <span data-rich>{text}</span> }));

const html = (text: string) => renderToStaticMarkup(<AnswerMarkdown text={text} />);

describe("AnswerMarkdown", () => {
  it("renders headings, lists, emphasis and code instead of literal markers", () => {
    const out = html("## 1. DEC-001: Rollout\n\n- **Bold point.** detail\n- *soft* and `code`\n\n1. first\n2. second");
    expect(out).toContain("<h3");
    expect(out).toContain("<ul");
    expect(out).toContain("<ol");
    expect(out).toContain("<strong");
    expect(out).toContain("<em");
    expect(out).toContain("<code");
    expect(out).not.toMatch(/##|\*\*|`/);
  });

  it("routes text through RichText so citations and decision links stay clickable", () => {
    const out = html("See **DEC-001** and [ZOOM-001]");
    expect(out.match(/data-rich/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("does not interpret raw HTML in an answer", () => {
    expect(html("<script>alert(1)</script>")).not.toContain("<script");
  });
});
