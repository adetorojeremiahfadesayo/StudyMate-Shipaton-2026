import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LearnWorkspace from "@/components/learn/LearnWorkspace";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseProps = {
  courseId: "course-1",
  courseName: "Equity",
  subjectType: "law" as const,
  educationLevel: "tertiary" as const,
  keyPoints: [],
  wikiPages: [],
};

describe("LearnWorkspace", () => {
  it("starts in Story Mode before Plain Mode", () => {
    render(<LearnWorkspace {...baseProps} noteContent={null} />);

    const storyButton = screen.getByRole("button", { name: /story mode/i });
    const plainButton = screen.getByRole("button", { name: /plain mode/i });

    expect(storyButton).toHaveClass("bg-violet-700");
    expect(storyButton.compareDocumentPosition(plainButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("does not preload generated notes into the explainer answer area", () => {
    render(
      <LearnWorkspace
        {...baseProps}
        noteContent="This guide-like note should not appear before the student asks."
      />,
    );

    expect(screen.getByText("Your explainer will appear here")).toBeInTheDocument();
    expect(screen.queryByText(/guide-like note/i)).not.toBeInTheDocument();
  });
});
