import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetronomeControls } from "./MetronomeControls";

function setup(overrides: Partial<React.ComponentProps<typeof MetronomeControls>> = {}) {
  const props: React.ComponentProps<typeof MetronomeControls> = {
    bpm: 100,
    minBpm: 40,
    maxBpm: 160,
    setBpm: vi.fn(),
    isRunning: false,
    onToggle: vi.fn(),
    volume: 80,
    setVolume: vi.fn(),
    onTap: vi.fn(),
    tapDetectedBpm: null,
    onAcceptTap: vi.fn(),
    ...overrides,
  };
  render(<MetronomeControls {...props} />);
  return props;
}

describe("MetronomeControls", () => {
  it("shows the current BPM", () => {
    setup({ bpm: 132 });
    expect(screen.getByText("132")).toBeInTheDocument();
  });

  it("shows START when stopped", () => {
    setup({ isRunning: false });
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("shows STOP when running", () => {
    setup({ isRunning: true });
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("calls onToggle when the transport button is clicked", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls setBpm with bpm+1 when the increase button is clicked", async () => {
    const user = userEvent.setup();
    const props = setup({ bpm: 100 });
    await user.click(screen.getByRole("button", { name: /increase tempo/i }));
    expect(props.setBpm).toHaveBeenCalledWith(101);
  });

  it("calls onTap when Tap Tempo is clicked", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole("button", { name: /tap tempo/i }));
    expect(props.onTap).toHaveBeenCalledTimes(1);
  });

  it("shows an accept button once a tap tempo is detected", () => {
    setup({ tapDetectedBpm: 128 });
    expect(screen.getByRole("button", { name: /use 128 bpm/i })).toBeInTheDocument();
  });
});
