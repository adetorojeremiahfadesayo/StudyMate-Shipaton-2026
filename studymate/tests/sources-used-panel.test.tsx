import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SourcesUsedPanel from "@/components/shared/SourcesUsedPanel";

describe("SourcesUsedPanel", () => {
  it("shows the knowledge layer and deduplicated sources", () => {
    render(
      <SourcesUsedPanel
        knowledgeLayer="foundry_iq"
        sources={["Negligence", "Negligence", "Donoghue v Stevenson"]}
      />,
    );

    expect(screen.getByText("Sources used")).toBeInTheDocument();
    expect(screen.getByText("Microsoft Foundry IQ")).toBeInTheDocument();
    expect(screen.getByText("Negligence")).toBeInTheDocument();
    expect(screen.getByText("Donoghue v Stevenson")).toBeInTheDocument();
    expect(screen.getAllByText("Negligence")).toHaveLength(1);
  });

  it("falls back to course material copy when no source names are available", () => {
    render(<SourcesUsedPanel sources={[]} />);

    expect(screen.getByText("Grounded in uploaded course material.")).toBeInTheDocument();
  });
});
