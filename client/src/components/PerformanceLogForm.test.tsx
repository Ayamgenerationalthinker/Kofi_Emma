import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerformanceLogForm } from "./PerformanceLogForm";

describe("PerformanceLogForm", () => {
  it("submits the entered values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PerformanceLogForm defaultDuration={10} defaultBpm={100} onSubmit={onSubmit} submitting={false} />);

    await user.click(screen.getByRole("button", { name: /mark attempt/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ cleanBpm: 100, accuracy: 90, durationMinutes: 10, maximumBpm: null })
    );
  });

  it("rejects a maximum BPM lower than the clean BPM (section 25 validation)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PerformanceLogForm defaultDuration={10} defaultBpm={140} onSubmit={onSubmit} submitting={false} />);

    const maxBpmInput = screen.getByLabelText(/maximum bpm/i);
    await user.clear(maxBpmInput);
    await user.type(maxBpmInput, "100");

    await user.click(screen.getByRole("button", { name: /mark attempt/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/cannot exceed maximum/i);
  });
});
