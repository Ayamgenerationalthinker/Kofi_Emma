import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoopPlayer } from "./LoopPlayer";
import { useShedTrackPlayer } from "../../hooks/useShedTrackPlayer";
import { getTrack } from "../../data/shedTracks";
import { installWebAudioMock, MockAudioContext, uninstallWebAudioMock } from "../../test/webAudioMock";

const DEMO_TRACK = getTrack("architecture-demo")!;

function Harness() {
  const player = useShedTrackPlayer(DEMO_TRACK);
  return <LoopPlayer player={player} track={DEMO_TRACK} />;
}

describe("LoopPlayer", () => {
  beforeEach(() => installWebAudioMock());
  afterEach(() => uninstallWebAudioMock());

  it("renders the transport once the demo track's synthetic audio is ready", async () => {
    render(<Harness />);
    expect(await screen.findByLabelText("Play")).toBeInTheDocument();
    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
  });

  it("play/pause toggles the transport button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const playButton = await screen.findByLabelText("Play");

    await user.click(playButton);
    expect(await screen.findByLabelText("Pause")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Pause"));
    expect(await screen.findByLabelText("Play")).toBeInTheDocument();
  });

  it("restart is reachable and does not throw while stopped", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Play");
    await user.click(screen.getByLabelText("Restart"));
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("BPM +/- buttons move the displayed tempo without stopping playback", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Play");
    await user.click(screen.getByLabelText("Play"));
    await screen.findByLabelText("Pause");

    const initialBpm = screen.getByTestId("loop-player-bpm").textContent;
    await user.click(screen.getByLabelText("Increase tempo"));

    await waitFor(() => {
      expect(screen.getByTestId("loop-player-bpm").textContent).not.toBe(initialBpm);
    });
    // Still playing — a BPM change must not have stopped/reloaded the track.
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("tap tempo shows a detected BPM after two taps and can be applied", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Play");

    const tapButton = screen.getByRole("button", { name: /tap tempo/i });
    await user.click(tapButton);
    await user.click(tapButton);

    const useBpmButton = await screen.findByRole("button", { name: /use \d+ bpm/i });
    await user.click(useBpmButton);
    expect(screen.queryByRole("button", { name: /use \d+ bpm/i })).not.toBeInTheDocument();
  });

  it("loop toggle engages a loop and the section buttons select regions", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Play");

    const loopToggle = screen.getByLabelText("Toggle loop");
    expect(loopToggle).toHaveAttribute("aria-pressed", "false");
    await user.click(loopToggle);
    expect(loopToggle).toHaveAttribute("aria-pressed", "true");

    const chorusButton = screen.getByRole("button", { name: /loop chorus/i });
    await user.click(chorusButton);
    expect(chorusButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the current section indicator among the track's sections", async () => {
    render(<Harness />);
    await screen.findByLabelText("Play");
    for (const name of ["Intro", "Verse", "Chorus", "Outro"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("shows an unavailable state for a track with no production audio, instead of a broken player", async () => {
    const placeholder = getTrack("track-gospel-01")!;
    function UnavailableHarness() {
      const player = useShedTrackPlayer(placeholder);
      return <LoopPlayer player={player} track={placeholder} />;
    }
    render(<UnavailableHarness />);
    expect(await screen.findByText(/production audio not added yet/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Play")).not.toBeInTheDocument();
  });

  it("cleans up its AudioContext on unmount — no leaked context", async () => {
    const { unmount } = render(<Harness />);
    const playButton = await screen.findByLabelText("Play");
    const user = userEvent.setup();
    await user.click(playButton);
    await screen.findByLabelText("Pause");

    expect(MockAudioContext.instances.length).toBeGreaterThan(0);
    const ctx = MockAudioContext.instances[MockAudioContext.instances.length - 1];
    expect(ctx.closed).toBe(false);

    unmount();
    await waitFor(() => expect(ctx.closed).toBe(true));
  });
});
