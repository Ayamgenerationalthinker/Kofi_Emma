import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TempoBuilder } from "./TempoBuilder";
import { FillTrainer } from "./FillTrainer";
import { TransitionTrainer } from "./TransitionTrainer";
import { LiveChurch } from "./LiveChurch";
import { CallAndResponse } from "./CallAndResponse";
import { Library } from "./Library";
import { MicCoach } from "./MicCoach";
import { AppProvider } from "../context/AppContext";

describe("New Interactive Practice Modes & Trainers", () => {
  it("renders TempoBuilder with start controls and settings", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <TempoBuilder />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Tempo Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/START TEMPO LADDER/i)).toBeInTheDocument();
    expect(screen.getByText(/Start BPM/i)).toBeInTheDocument();
  });

  it("renders FillTrainer with 4-bar visualizer and fill library", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <FillTrainer />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Fill Trainer/i)).toBeInTheDocument();
    expect(screen.getByText(/START 4-BAR LOOP/i)).toBeInTheDocument();
    expect(screen.getByText(/Fill Library/i)).toBeInTheDocument();
  });

  it("renders TransitionTrainer with section A & B cards", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <TransitionTrainer />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Transition Trainer/i)).toBeInTheDocument();
    expect(screen.getByText(/START TRANSITION LOOP/i)).toBeInTheDocument();
    expect(screen.getByText(/Section A \(Starting Feel\)/i)).toBeInTheDocument();
  });

  it("renders LiveChurch with service stage flow and MD cues", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <LiveChurch />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Church Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/START LIVE SERVICE/i)).toBeInTheDocument();
    expect(screen.getByText(/Music Director Cue:/i)).toBeInTheDocument();
  });

  it("renders CallAndResponse ear-training studio", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <CallAndResponse />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Call & Response/i)).toBeInTheDocument();
    expect(screen.getByText(/PLAY CALL PHRASE/i)).toBeInTheDocument();
  });

  it("renders Drummer's Library with educational articles", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <Library />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Drummer's Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Less is More/i)).toBeInTheDocument();
    expect(screen.getByText(/Ghanaian Gospel Drumming Tradition/i)).toBeInTheDocument();
  });

  it("renders MicCoach with honest architecture preview", () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MicCoach />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Microphone Coach/i)).toBeInTheDocument();
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Browser Microphone/i)).toBeInTheDocument();
  });
});
