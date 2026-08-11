import { describe, it, expect } from "vitest";
import { readIntegration, isConnected } from "./config";

describe("readIntegration", () => {
  it("is enabled only for on/1/true, and trims the URL", () => {
    expect(readIntegration({ SAJTPRESS_INTEGRATION: "on" }).enabled).toBe(true);
    expect(readIntegration({ SAJTPRESS_INTEGRATION: "1" }).enabled).toBe(true);
    expect(readIntegration({ SAJTPRESS_INTEGRATION: "TRUE" }).enabled).toBe(true);
    expect(readIntegration({ SAJTPRESS_INTEGRATION: "off" }).enabled).toBe(false);
    expect(readIntegration({}).enabled).toBe(false);
    expect(readIntegration({ WEBAPP_INTERNAL_URL: "https://webapp.sajtpress.rs/" }).webappUrl).toBe(
      "https://webapp.sajtpress.rs"
    );
  });

  it("isConnected requires the flag AND a url AND a secret", () => {
    expect(isConnected(readIntegration({ SAJTPRESS_INTEGRATION: "on" }))).toBe(false); // no url/secret
    expect(
      isConnected(
        readIntegration({
          SAJTPRESS_INTEGRATION: "on",
          WEBAPP_INTERNAL_URL: "https://webapp.sajtpress.rs",
          INTERNAL_API_SECRET: "s3cret",
        })
      )
    ).toBe(true);
    // configured but flag off -> standalone
    expect(
      isConnected(
        readIntegration({
          SAJTPRESS_INTEGRATION: "off",
          WEBAPP_INTERNAL_URL: "https://webapp.sajtpress.rs",
          INTERNAL_API_SECRET: "s3cret",
        })
      )
    ).toBe(false);
  });
});
