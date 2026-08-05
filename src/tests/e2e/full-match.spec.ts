import { test, expect } from "@playwright/test";

test("plays a complete 2-player Classic match end to end with configured settings honored", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto("/setup/players");
  await page.getByRole("textbox", { name: "Player 1", exact: true }).fill("Maya");
  await page.getByRole("textbox", { name: "Player 2", exact: true }).fill("Theo");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/setup/match");

  // A small, custom target range proves the edited settings are actually honored by the
  // created match, not silently reverted to defaults (regression coverage).
  await page.getByLabel("Min target").fill("5");
  await page.getByLabel("Max target").fill("8");
  await page.getByRole("button", { name: "Start match" }).click();
  await page.waitForURL("**/play");

  // Always tapping +1 guarantees landing exactly on the secret target eventually,
  // without the test needing to know what it is.
  for (let step = 0; step < 40; step++) {
    if (
      await page
        .getByText("Match complete")
        .isVisible()
        .catch(() => false)
    )
      break;

    const tapReady = page.getByRole("button", { name: "Tap when ready" });
    const plusOne = page.getByRole("button", { name: "+1", exact: true });

    if (await tapReady.isVisible().catch(() => false)) {
      await tapReady.click();
      continue;
    }
    if (await plusOne.isVisible().catch(() => false)) {
      await plusOne.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(220);
      continue;
    }
    await page.waitForTimeout(100);
  }

  await expect(page.getByText("Match complete")).toBeVisible();
  await expect(page.getByText(/wins!$/)).toBeVisible();

  const raw = await page.evaluate(() => localStorage.getItem("numera-active-match"));
  const match = raw ? JSON.parse(raw).state.match : null;
  expect(match.status).toBe("completed");
  expect(match.settings.targetRange).toEqual({ min: 5, max: 8 });
  // The secret target itself must stay within the configured range, proving the edited
  // settings (not silently-reverted defaults) actually drove target generation.
  expect(match.roundHistory[0].target).toBeGreaterThanOrEqual(5);
  expect(match.roundHistory[0].target).toBeLessThanOrEqual(8);

  expect(consoleErrors).toEqual([]);
});
