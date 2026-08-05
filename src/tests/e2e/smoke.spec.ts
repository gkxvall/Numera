import { test, expect } from "@playwright/test";

test("home page loads and shows the Numera brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Numera" })).toBeVisible();
});
