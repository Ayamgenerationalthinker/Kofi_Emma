// A minimal, behavior-faithful Web Audio API stand-in for jsdom (which
// implements none of it). Used by audio tests — installed with
// `installWebAudioMock()` in a `beforeEach` and torn down with
// `uninstallWebAudioMock()` in `afterEach` so it never leaks into unrelated
// test files.

export interface MockAudioParam {
  value: number;
  setValueAtTime(value: number, time: number): MockAudioParam;
  exponentialRampToValueAtTime(value: number, time: number): MockAudioParam;
  linearRampToValueAtTime(value: number, time: number): MockAudioParam;
  setValueCurveAtTime(values: Float32Array, startTime: number, duration: number): MockAudioParam;
}

function createParam(initial: number): MockAudioParam {
  const param: MockAudioParam = {
    value: initial,
    setValueAtTime(value) {
      param.value = value;
      return param;
    },
    exponentialRampToValueAtTime(value) {
      param.value = value;
      return param;
    },
    linearRampToValueAtTime(value) {
      param.value = value;
      return param;
    },
    setValueCurveAtTime(_values) {
      return param;
    },
  };
  return param;
}

export class MockGainNode {
  gain = createParam(1);
  connect(): void {}
  disconnect(): void {}
}

export class MockOscillatorNode {
  type = "sine";
  frequency = createParam(440);
  connect(): void {}
  disconnect(): void {}
  start(): void {}
  stop(): void {}
}

export class MockBiquadFilterNode {
  type = "lowpass";
  frequency = createParam(1000);
  Q = createParam(1);
  gain = createParam(0);
  connect(): void {}
  disconnect(): void {}
}

export class MockBufferSourceNode {
  buffer: unknown = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate = createParam(1);
  onended: (() => void) | null = null;
  startCallCount = 0;
  stopCallCount = 0;
  lastStartOffset = 0;

  connect(): void {}
  disconnect(): void {}

  start(_when?: number, offset = 0): void {
    this.startCallCount += 1;
    this.lastStartOffset = offset;
  }

  stop(): void {
    this.stopCallCount += 1;
  }
}

function makeMockBuffer(numberOfChannels: number, length: number, sampleRate: number) {
  const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  return {
    numberOfChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (channel: number) => channels[channel],
  } as unknown as AudioBuffer;
}

export class MockAudioContext {
  static instances: MockAudioContext[] = [];

  currentTime = 0;
  state: "running" | "suspended" | "closed" = "running";
  destination = {};
  closed = false;
  sampleRate: number;

  constructor(..._args: unknown[]) {
    this.sampleRate = 44100;
    MockAudioContext.instances.push(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode();
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode();
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }

  createBufferSource(): MockBufferSourceNode {
    return new MockBufferSourceNode();
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    return makeMockBuffer(numberOfChannels, length, sampleRate);
  }

  decodeAudioData(_data: ArrayBuffer): Promise<AudioBuffer> {
    return Promise.resolve(makeMockBuffer(1, this.sampleRate, this.sampleRate));
  }

  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = "closed";
    this.closed = true;
    return Promise.resolve();
  }
}

export function installWebAudioMock(): void {
  MockAudioContext.instances = [];
  (window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
  (window as unknown as { OfflineAudioContext: unknown }).OfflineAudioContext = MockAudioContext;
}

export function uninstallWebAudioMock(): void {
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  delete (window as unknown as { OfflineAudioContext?: unknown }).OfflineAudioContext;
}
