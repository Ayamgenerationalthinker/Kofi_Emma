import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StickingVisualizer } from "./StickingVisualizer";
import type { MetronomeEvent } from "../lib/types";

const events: MetronomeEvent[] = [
  { position: 0, limb: "R", accent: true },
  { position: 1, limb: "L" },
  { position: 2, limb: "K" },
  { position: 3, limb: "K" },
  { position: 4, limb: "R" },
  { position: 5, limb: "L" },
];

describe("StickingVisualizer", () => {
  it("renders one item per pattern event", () => {
    render(<StickingVisualizer events={events} currentStepIndex={-1} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("marks the current step with aria-current for accessibility", () => {
    render(<StickingVisualizer events={events} currentStepIndex={2} />);
    const items = screen.getAllByRole("listitem");
    expect(items[2]).toHaveAttribute("aria-current", "true");
    expect(items[0]).not.toHaveAttribute("aria-current");
  });

  it("announces the current limb via an aria-live region, not color alone", () => {
    render(<StickingVisualizer events={events} currentStepIndex={2} />);
    expect(screen.getByText("Current: Kick")).toBeInTheDocument();
  });
});
