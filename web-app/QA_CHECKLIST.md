# QA Checklist (Web App)

Use this checklist before merge/push or release.

## 1. Build/Test Gate

- [ ] `npm test` passes locally
- [ ] `npm run test:e2e` passes locally
- [ ] No errors in IDE Problems panel for modified files

## 2. Duel Smoke Test

- [ ] App loads with no Console errors
- [ ] Duel rounds progress (choose winner, next round)
- [ ] Details button opens player scoring modal
- [ ] Share button copies duel summary
- [ ] Filters update eligible players and keep app playable

## 3. Daily Mode Smoke Test

- [ ] Daily tab opens with no Console errors
- [ ] Search suggestions work with keyboard and mouse
- [ ] Guess list renders 5 hint columns
- [ ] At 4 failed guesses, one optional hint offer appears (2 choices + skip)
- [ ] At 8 failed guesses, second optional hint offer appears
- [ ] Revealed hints card updates after choosing a hint
- [ ] End-of-game result shows Share and Details buttons
- [ ] Details button opens target player's scoring modal
- [ ] Share text includes emoji grid and hints-used line

## 4. i18n Spot Check

- [ ] Switch language and verify key labels update in Duel and Daily tabs
- [ ] Daily offer texts are translated (`dailyHintOffer*` keys)

## 5. Persistence Checks

- [ ] Reload page mid-daily-game and verify state restore
- [ ] LocalStorage corruption does not crash app (safe JSON fallback)

## 6. Browser/Cache Notes

- [ ] Ignore HTTP `304` responses in Network tab (normal cache revalidation)
- [ ] Focus on runtime Console errors for real breakages
