import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StemMixer } from "./StemMixer";
import { useShedTrackPlayer } from "../../hooks/useShedTrackPlayer";
import { getTrack, STEM_NAMES } from "../../data/shedTracks";
import { installWebAudioMock, uninstallWebAudioMock } from "../../test/webAudioMock";

const DEMO_TRACK = getTrack("architecture-demo")!;

function Harness() {
  const player = useShedTrackPlayer(DEMO_TRACK);
  return <StemMixer player={player} />;
}

describe("StemMixer", () => {
  beforeEach(() => installWebAudioMock());
  afterEach(() => uninstallWebAudioMock());

  it("renders all six supported stems for the demo track", async () => {
    render(<Harness />);
    for (const stem of STEM_NAMES) {
      expect(await screen.findByLabelText(`${stem} volume`)).toBeInTheDocument();
    }
  });

  it("shows the 'remove the drums' primary action", async () => {
    render(<Harness />);
    expect(await screen.findByRole("button", { name: /remove the drums/i })).toBeInTheDocument();
  });

  it("muting Drums via the primary action flips it to 'Drums Removed'", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const removeButton = await screen.findByRole("button", { name: /remove the drums/i });
    await user.click(removeButton);
    expect(await screen.findByRole("button", { name: /drums removed/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Unmute Drums")).toBeInTheDocument();
  });

  it("the per-stem mute button mirrors the same state as the primary action", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Drums volume");
    await user.click(screen.getByLabelText("Mute Bass"));
    expect(await screen.findByLabelText("Unmute Bass")).toHaveAttribute("aria-pressed", "true");
  });

  it("solo isolates one stem — soloing Keys is reflected in its own control", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Drums volume");

    const soloKeys = screen.getByLabelText("Solo Keys");
    await user.click(soloKeys);
    expect(await screen.findByLabelText("Unsolo Keys")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByLabelText("Unsolo Keys"));
    expect(await screen.findByLabelText("Solo Keys")).toHaveAttribute("aria-pressed", "false");
  });

  it("solo and mute interact: soloing one stem does not itself mute other stems' own mute state", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByLabelText("Drums volume");

    await user.click(screen.getByLabelText("Solo Vocals"));
    // Other stems' *displayed* mute state is untouched by someone else's solo — solo affects audible output via the engine, not each stem's own mute flag.
    expect(screen.getByLabelText("Mute Drums")).toHaveAttribute("aria-pressed", "false");
  });

  it("volume slider changes the stem's volume", async () => {
    render(<Harness />);
    const volumeSlider = await screen.findByLabelText("Guitar volume");
    expect(volumeSlider).toHaveValue("100");

    // jsdom doesn't implement a native <input type="range">'s arrow-key
    // stepping (that's browser UA behavior, not something user-event can
    // simulate), so drive the change event directly.
    fireEvent.change(volumeSlider, { target: { value: "80" } });
    expect(volumeSlider).toHaveValue("80");
  });

  it("volume slider is disabled while the stem is muted", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(await screen.findByLabelText("Mute Percussion"));
    expect(await screen.findByLabelText("Percussion volume")).toBeDisabled();
  });

  it("shows a no-stems message for a track with only a single voice, instead of a broken mixer", async () => {
    // A track with only `audioUrl` (no stems) resolves to one "master" voice
    // via a real fetch+decode — jsdom has no network, so stub `fetch` to
    // resolve with something `decodeAudioData` (mocked) can consume.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
    vi.stubGlobal("fetch", fetchMock);

    const singleVoiceTrack = { ...DEMO_TRACK, id: "single-voice-test", isArchitectureDemo: false, audioUrl: "/audio/shed-tracks/fake.mp3", stems: null };
    function SingleVoiceHarness() {
      const player = useShedTrackPlayer(singleVoiceTrack);
      return <StemMixer player={player} />;
    }
    render(<SingleVoiceHarness />);
    expect(await screen.findByText(/doesn't have separate stems yet/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("renders nothing (no broken mixer) when no audio is available at all", async () => {
    const placeholder = getTrack("track-gospel-01")!;
    function UnavailableHarness() {
      const player = useShedTrackPlayer(placeholder);
      return <StemMixer player={player} />;
    }
    const { container } = render(<UnavailableHarness />);
    // The hook resolves loadState to "unavailable" asynchronously (there's
    // no audio to load); wait for that to settle instead of asserting
    // synchronously, so the state update lands inside act().
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
