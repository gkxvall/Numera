import { test, expect } from "@playwright/test";

test("shows the elimination screen on a round loss and 'Play again' starts a fresh match", async ({
  page,
}) => {
  // Multi-life with an adaptive range can take many rounds to finish; the default
  // Playwright per-test timeout (30s) is too tight for that many click/gate cycles.
  test.setTimeout(90_000);

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto("/setup/players");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/setup/match");

  // Multi-life so we see a round_ended screen before the match actually finishes.
  await page.getByRole("button", { name: "Party" }).click();
  await page.getByRole("button", { name: "Start match" }).click();
  await page.waitForURL("**/play");

  let sawElimination = false;
  for (let step = 0; step < 200; step++) {
    if (sawElimination) break;

    const tapReady = page.getByRole("button", { name: "Tap when ready" });
    const continueBtn = page.getByRole("button", { name: "Continue" });
    const plusOne = page.getByRole("button", { name: "+1", exact: true });

    if (await continueBtn.isVisible().catch(() => false)) {
      await expect(page.getByText(/lost a life\.|was eliminated!/)).toBeVisible();
      await expect(page.getByText(/The number was/)).toBeVisible();
      sawElimination = true;
      break;
    }
    if (await tapReady.isVisible().catch(() => false)) {
      await tapReady.click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    if (await plusOne.isVisible().catch(() => false)) {
      await plusOne.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(220);
      continue;
    }
    await page.waitForTimeout(100);
  }
  expect(sawElimination).toBe(true);

  const idBeforeRematch = JSON.parse(
    (await page.evaluate(() => localStorage.getItem("numera-active-match")))!,
  ).state.match.id;

  // Drive the rest of the match to completion, then use the rematch flow.
  for (let step = 0; step < 250; step++) {
    if (
      await page
        .getByText("Match complete")
        .isVisible()
        .catch(() => false)
    )
      break;

    const tapReady = page.getByRole("button", { name: "Tap when ready" });
    const continueBtn = page.getByRole("button", { name: "Continue" });
    const plusOne = page.getByRole("button", { name: "+1", exact: true });

    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    if (await tapReady.isVisible().catch(() => false)) {
      await tapReady.click({ timeout: 2000 }).catch(() => {});
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
  await page.getByRole("button", { name: /play again/i }).click();

  await expect(page.getByRole("button", { name: "Tap when ready" })).toBeVisible();
  const rawAfter = await page.evaluate(() => localStorage.getItem("numera-active-match"));
  const matchAfter = JSON.parse(rawAfter!).state.match;
  expect(matchAfter.status).toBe("in_progress");
  expect(matchAfter.currentRound).toBe(1);
  expect(matchAfter.id).not.toBe(idBeforeRematch);

  expect(consoleErrors).toEqual([]);
});
