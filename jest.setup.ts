import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  }

  if (!("ResizeObserver" in window)) {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: MockResizeObserver,
    });
  }

  if (!window.speechSynthesis) {
    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      value: {
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        getVoices: jest.fn(() => []),
      },
    });
  }
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

if (typeof globalThis.SpeechSynthesisUtterance === "undefined") {
  class MockSpeechSynthesisUtterance {
    text: string;
    lang = "en-US";
    rate = 1;
    constructor(text: string) {
      this.text = text;
    }
  }
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    writable: true,
    value: MockSpeechSynthesisUtterance,
  });
}
