import { AlpacaApiError } from "../../src/alpaca/alpaca-api-error.js";

describe("AlpacaApiError", () => {
  it("carries the status and body from the failing response", () => {
    const error = new AlpacaApiError(401, { message: "forbidden" });

    expect(error.status).toBe(401);
    expect(error.body).toEqual({ message: "forbidden" });
  });

  it("names itself AlpacaApiError and reports the status + body in its message", () => {
    const error = new AlpacaApiError(500, { message: "boom" });

    expect(error.name).toBe("AlpacaApiError");
    expect(error.message).toBe('Alpaca API error 500: {"message":"boom"}');
  });

  it("is a real Error instance", () => {
    const error = new AlpacaApiError(404, null);

    expect(error).toBeInstanceOf(Error);
  });
});
