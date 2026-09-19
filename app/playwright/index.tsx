// Playwright Component Testing's mount entry — loaded once per test browser context.
// Imports the app's real stylesheet so a CT-mounted component renders exactly as it would inside
// the app shell, not bare unstyled HTML.
import "../src/styles/index.css";
