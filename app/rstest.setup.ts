import "@testing-library/jest-dom";
import { afterEach } from "@rstest/core";
import { cleanup, configure } from "@testing-library/react";

// Unmount every rendered component between tests — without this, one spec's DOM nodes leak into
// the next and queries silently match the wrong render.
afterEach(() => {
  cleanup();
});

// How long findBy*/waitFor poll before giving up (#5498). The 1 s default is a wall-clock guess at how
// long a route tree takes to mount; on a saturated machine (the full gate runs every suite in
// parallel) a correct render lands later and the spec fails as "Unable to find". A poll returns the
// moment its condition holds, so a roomy ceiling costs a passing spec nothing, and it stays under
// the 5 s per-test budget, so a genuine miss still reports what it could not find, with the DOM.
configure({ asyncUtilTimeout: 4000 });
