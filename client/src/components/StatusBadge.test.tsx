import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("shows a text label for MASTERED, not only a color", () => {
    render(<StatusBadge status="MASTERED" />);
    expect(screen.getByText("Mastered")).toBeInTheDocument();
  });

  it("shows a text label for LOCKED", () => {
    render(<StatusBadge status="LOCKED" />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("shows a text label for REPEAT", () => {
    render(<StatusBadge status="REPEAT" />);
    expect(screen.getByText("Repeat")).toBeInTheDocument();
  });
});
