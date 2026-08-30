import "@testing-library/jest-dom";
import { afterEach } from "@rstest/core";
import { cleanup } from "@testing-library/react";

// Unmount every rendered component between tests — without this, one spec's DOM nodes leak into
// the next and queries silently match the wrong render.
afterEach(() => {
  cleanup();
});
