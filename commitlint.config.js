export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // The commit body is a document (docs/ENGINEERING.md → Change communication); a backticked
    // path or URL routinely runs past 100 chars and a wrapped one reads worse. A gate that
    // protects no constraint is a momentum breaker (Eric, 2026-09-06; docs/COACHES.md).
    "body-max-line-length": [0],
  },
};
