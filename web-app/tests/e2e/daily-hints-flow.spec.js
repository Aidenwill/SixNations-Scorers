import { test, expect } from '@playwright/test';

const LABEL_TO_FIELD_KEY = {
  Team: 'team',
  Points: 'points',
  Start: 'activityStart',
  End: 'activityEnd',
  Name: 'nameLength'
};

function computeDailyDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function buildWrongIds(page, count) {
  return page.evaluate(async ({ dateStr, count }) => {
    const players = await fetch('players.json', { cache: 'no-store' }).then((r) => r.json());
    const list = (players || []).map((p) => ({
      id: String(p.id ?? p.Id ?? ''),
      name: p.name ?? p.Name ?? 'Unknown'
    })).filter((p) => p.id);

    let hash = 5381;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (((hash << 5) + hash) ^ dateStr.charCodeAt(i)) | 0;
    }

    const target = list[Math.abs(hash) % list.length];
    const wrongIds = list.filter((p) => p.id !== target.id).slice(0, count).map((p) => p.id);
    return { targetId: target.id, wrongIds };
  }, { dateStr: computeDailyDateString(), count });
}

async function setDailyState(page, options) {
  await page.evaluate((payload) => {
    localStorage.setItem('sixnations_daily_date', payload.dateStr);
    localStorage.setItem('sixnations_daily_guesses', JSON.stringify(payload.guesses));
    localStorage.setItem('sixnations_daily_won', String(payload.won));
    localStorage.setItem('sixnations_daily_given_up', String(payload.givenUp));
    localStorage.setItem('sixnations_daily_revealed_fields', JSON.stringify(payload.revealedFields));
    localStorage.setItem('sixnations_daily_hint_offers', JSON.stringify(payload.hintOffers));
  }, options);
}

test.describe('Daily mode hint flow', () => {
  test('offers hints at 4/8 failures, supports choose/skip, and keeps details button on reveal', async ({ page }) => {
    await page.goto('/');

    const dateStr = computeDailyDateString();
    const firstPool = await buildWrongIds(page, 8);

    await setDailyState(page, {
      dateStr,
      guesses: firstPool.wrongIds.slice(0, 4),
      won: false,
      givenUp: false,
      revealedFields: [],
      hintOffers: []
    });

    await page.reload();
    await page.click('#tab-btn-daily');

    await expect(page.locator('#daily-attempts-label')).toContainText('4/12');
    await expect(page.locator('#daily-hint-offer')).toBeVisible();

    const options = page.locator('#daily-hint-offer .daily-hint-option');
    await expect(options).toHaveCount(2);

    const chosenLabel = (await options.nth(0).innerText()).trim();
    const chosenField = LABEL_TO_FIELD_KEY[chosenLabel] || 'team';
    await options.nth(0).click();

    await expect(page.locator('#daily-revealed-hints')).toBeVisible();
    await expect(page.locator('#daily-revealed-hints li')).toHaveCount(1);
    await expect(page.locator('#daily-revealed-hints')).toContainText(chosenLabel);

    const secondPool = await buildWrongIds(page, 8);
    await setDailyState(page, {
      dateStr,
      guesses: secondPool.wrongIds,
      won: false,
      givenUp: false,
      revealedFields: [chosenField],
      hintOffers: [
        {
          step: 4,
          fields: ['team', 'nameLength'],
          resolved: true,
          chosenField
        }
      ]
    });

    await page.reload();
    await page.click('#tab-btn-daily');

    await expect(page.locator('#daily-attempts-label')).toContainText('8/12');
    await expect(page.locator('#daily-hint-offer')).toBeVisible();
    const secondOptions = page.locator('#daily-hint-offer .daily-hint-option');
    const secondCount = await secondOptions.count();
    expect(secondCount).toBeGreaterThanOrEqual(1);
    expect(secondCount).toBeLessThanOrEqual(2);

    await page.click('#daily-hint-offer .daily-hint-skip');
    await expect(page.locator('#daily-hint-offer')).toBeHidden();

    await page.click('#daily-give-up');
    await expect(page.locator('#daily-result')).toBeVisible();
    await expect(page.locator('#daily-details-btn')).toBeVisible();

    await page.click('#daily-details-btn');
    await expect(page.locator('.player-details-modal')).toBeVisible();
    await expect(page.locator('.player-details-modal h3')).toBeVisible();
  });
});
