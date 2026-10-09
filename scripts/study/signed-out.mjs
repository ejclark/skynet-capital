// The page a study world shows at `/login` (#4943) — where the real auth gate sends a member who
// signs out. Production's sign-in page offers the identity provider's buttons, which leave the
// machine (a study world aborts every off-origin request), so the world declares this plain page
// instead and lists it as a known world artifact (worlds/shell-artifacts.mjs). Area-agnostic: it
// says the member is signed out and nothing about any surface.

export const SIGNED_OUT_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Signed out · Skynet Capital</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: #0b0f14; color: #e6edf3; font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 22rem; padding: 0 16px; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  p { margin: 0; color: #9fb0c0; }
</style>
</head>
<body>
<main>
  <h1>You're signed out</h1>
  <p>You have signed out of Skynet Capital.</p>
</main>
</body>
</html>
`;
