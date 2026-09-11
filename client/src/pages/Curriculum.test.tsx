import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Curriculum } from "./Curriculum";

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      headers: { get: () => "application/json" },
      json: async () => body,
    })
  );
}

describe("Curriculum page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a locked message and hides exercises for a locked phase (section 38)", async () => {
    mockFetchOnce({
      phases: [
        {
          id: "phase-1",
          number: 1,
          title: "The Foundation & Highlife Pocket",
          subtitle: "Foundation",
          unlocked: true,
          progress: 40,
          lockedMessage: null,
          exercises: [{ id: "P1-E01", name: "Single Stroke Control", slug: "single-stroke-control", category: "TECHNIQUE", difficulty: 1, targetBpm: 100, status: "AVAILABLE" }],
        },
        {
          id: "phase-2",
          number: 2,
          title: "Linear Subdivisions & Praise Medleys",
          subtitle: "Linear",
          unlocked: false,
          progress: 0,
          lockedMessage: "Master all Phase 1 prerequisites to unlock Linear Subdivisions & Praise Medleys.",
          exercises: [],
        },
      ],
    });

    render(
      <MemoryRouter>
        <Curriculum />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Master all Phase 1 prerequisites/)).toBeInTheDocument());
    expect(screen.getAllByText(/Linear Subdivisions & Praise Medleys/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Six-Stroke Linear")).not.toBeInTheDocument();
  });
});
