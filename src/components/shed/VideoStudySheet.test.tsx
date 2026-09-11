import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoStudySheet } from "./VideoStudySheet";
import type { KofiEmmaVideo } from "../../data/kofiEmmaVideos";
import { getVideoStudy, saveStudyNotes, toggleFavorite } from "../../services/videoStudyService";

function makeVideo(youtubeId: string, title: string): KofiEmmaVideo {
  return {
    id: youtubeId,
    youtubeId,
    title,
    category: "Grooves",
    description: "Test fixture video.",
    focus: "Test focus",
    level: null,
    tags: [],
    source: "Test",
    titleSource: "spec-provided",
  };
}

const VIDEO_A = makeVideo("videoA", "Video A");
const VIDEO_B = makeVideo("videoB", "Video B");

// Rendered exactly like Shed.tsx renders it: keyed by youtubeId, so
// switching videos remounts the sheet fresh rather than reusing the same
// instance's state across two different videos.
function renderSheet(video: KofiEmmaVideo | null, open: boolean) {
  return render(<VideoStudySheet key={video?.youtubeId ?? "none"} video={video} open={open} onClose={() => {}} />);
}

describe("VideoStudySheet", () => {
  it("loads a video's previously saved notice/notes/favorite state when opened", async () => {
    saveStudyNotes(VIDEO_A.youtubeId, ["Pocket", "Fills"], "Watch the hi-hat.");
    toggleFavorite(VIDEO_A.youtubeId);

    renderSheet(VIDEO_A, true);

    expect(await screen.findByRole("checkbox", { name: "Pocket" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Fills" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ghost notes" })).not.toBeChecked();
    expect(screen.getByDisplayValue("Watch the hi-hat.")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove from favorites")).toHaveAttribute("aria-pressed", "true");
  });

  it("toggling a notice and saving persists it to real storage", async () => {
    const user = userEvent.setup();
    renderSheet(VIDEO_A, true);

    await user.click(await screen.findByRole("checkbox", { name: "Ghost notes" }));
    await user.click(screen.getByRole("button", { name: /shed this idea/i }));

    const saved = getVideoStudy(VIDEO_A.youtubeId);
    expect(saved.watched).toBe(true);
    expect(saved.notedAspects).toContain("Ghost notes");
  });

  it("switching to a different video shows that video's own state, discarding unsaved edits from the previous one", async () => {
    const user = userEvent.setup();
    const { rerender } = renderSheet(VIDEO_A, true);

    // Toggle a checkbox for Video A but never save it.
    await user.click(await screen.findByRole("checkbox", { name: "Ghost notes" }));
    expect(screen.getByRole("checkbox", { name: "Ghost notes" })).toBeChecked();

    // Switch to a different, never-studied video (same re-render pass a
    // real "open a different card" action would trigger, key included).
    rerender(<VideoStudySheet key={VIDEO_B.youtubeId} video={VIDEO_B} open={true} onClose={() => {}} />);

    expect(await screen.findByText(VIDEO_B.title)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Ghost notes" })).not.toBeChecked();
    expect(screen.getByLabelText("Add to favorites")).toBeInTheDocument();

    // And Video A's real saved data was never polluted by the unsaved edit.
    expect(getVideoStudy(VIDEO_A.youtubeId).notedAspects).not.toContain("Ghost notes");
  });
});
