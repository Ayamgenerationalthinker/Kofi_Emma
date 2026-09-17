import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Curriculum } from "./Curriculum";
import { ensureProgressInitialized } from "../services/curriculumService";

describe("Curriculum page", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("shows a locked message and hides exercises for a locked phase", () => {
    render(
      <MemoryRouter>
        <Curriculum />
      </MemoryRouter>
    );

    expect(screen.getByText(/Master all Level 0 prerequisites/)).toBeInTheDocument();
    expect(screen.getAllByText(/Stage 1 — Hand Technique/).length).toBeGreaterThan(0);
  });

  it("shows the first stage-0 exercise as available once expanded", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Curriculum />
      </MemoryRouter>
    );

    await user.click(screen.getByText(/Stage 0 — Orientation/).closest("button")!);
    expect(await screen.findByText("5-Piece Drum Kit Anatomy & Setup")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });
});
