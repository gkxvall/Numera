import { test, expect } from "@playwright/test";

test("a power-up can be activated from the gameplay screen and is logged", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto("/setup/players");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/setup/match");
  // Power-ups are enabled by default (plan §6.2).
  await page.getByRole("button", { name: "Start match" }).click();
  await page.waitForURL("**/play");
  await page.getByRole("button", { name: "Tap when ready" }).click();

  const inventory = page.getByRole("group", { name: "Your power-ups" });
  await expect(inventory).toBeVisible();
  const firstPowerUp = inventory.getByRole("button").first();
  const rawLabel = (await firstPowerUp.textContent())!.trim();
  const label = rawLabel.replace(/\s*×\d+$/, "");

  await firstPowerUp.click();
  const dialog = page.getByRole("dialog", { name: label });
  await expect(dialog).toBeVisible();

  const useButton = dialog.getByRole("button", { name: `Use ${label}` });
  if (label === "Swap") {
    await dialog.getByRole("button").nth(1).click(); // first player-choice button
  } else if (label === "Pushback") {
    await dialog.getByRole("button", { name: "-1" }).click();
  }
  await useButton.click();

  await expect(page.getByText(`used ${label}`)).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
