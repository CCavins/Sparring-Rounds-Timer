import { expect, test, type Page } from '@playwright/test'

async function startShortWorkout(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('setup-view')).toBeVisible()

  const rounds = page.locator('#rounds')
  await rounds.fill('2')
  await rounds.blur()

  const roundDuration = page.locator('#round-duration')
  await roundDuration.fill('00:10')
  await roundDuration.blur()

  const restDuration = page.locator('#rest-duration')
  await restDuration.fill('00:05')
  await restDuration.blur()

  await page.locator('label.setup__prep-option', { hasText: 'Off' }).click()
  await page.getByTestId('start-timer').click()
  await expect(page.getByTestId('timer-view')).toBeVisible()
}

function phaseLabel(page: Page, label: string) {
  return page.getByTestId('timer-view').locator('.badge__label', { hasText: label })
}

test.describe('Spar Timer', () => {
  test('configures and starts a workout', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Spar Timer' })).toBeVisible()
    await page.getByRole('button', { name: 'MMA' }).click()
    await expect(page.locator('#round-duration')).toHaveValue('05:00')
    await page.getByTestId('start-timer').click()
    await expect(page.getByTestId('timer-view')).toBeVisible()
    await expect(phaseLabel(page, 'GET READY')).toBeVisible()
    await expect(page.getByTestId('countdown')).toBeVisible()
  })

  test('pauses and resumes', async ({ page }) => {
    await startShortWorkout(page)
    await expect(phaseLabel(page, 'SPARRING')).toBeVisible()
    const before = await page.getByTestId('countdown').innerText()
    await page.getByTestId('pause-resume').click()
    await expect(phaseLabel(page, 'PAUSED')).toBeVisible()
    await page.waitForTimeout(1200)
    await expect(page.getByTestId('countdown')).toHaveText(before)
    await page.getByTestId('pause-resume').click()
    await expect(phaseLabel(page, 'SPARRING')).toBeVisible()
  })

  test('skips a round with confirmation', async ({ page }) => {
    await startShortWorkout(page)
    await expect(phaseLabel(page, 'SPARRING')).toBeVisible()
    await page.getByTestId('skip').click()
    await page.getByRole('button', { name: 'Skip Round' }).click()
    await expect(phaseLabel(page, 'REST')).toBeVisible()
  })

  test('completes a short two-round workout', async ({ page }) => {
    await startShortWorkout(page)

    await page.getByTestId('skip').click()
    await page.getByRole('button', { name: 'Skip Round' }).click()
    await expect(phaseLabel(page, 'REST')).toBeVisible()

    await page.getByTestId('skip').click()
    await expect(phaseLabel(page, 'SPARRING')).toBeVisible()
    await expect(page.getByTestId('round-label')).toContainText('Round 2 of 2')

    await page.getByTestId('skip').click()
    await page.getByRole('button', { name: 'Skip Round' }).click()
    await expect(page.getByTestId('complete-view')).toBeVisible()
    await expect(page.getByTestId('completed-rounds')).toContainText('2 rounds')
  })

  test('responsive layout at mobile portrait and desktop landscape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startShortWorkout(page)
    const timer = page.getByTestId('timer-view')
    await expect(timer).toBeVisible()
    const mobileBox = await timer.boundingBox()
    expect(mobileBox?.height).toBeGreaterThan(700)

    await page.setViewportSize({ width: 1366, height: 768 })
    await expect(timer).toBeVisible()
    await expect(page.getByTestId('countdown')).toBeVisible()
    await expect(page.getByTestId('pause-resume')).toBeVisible()
  })

  test('keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    await page.locator('label.setup__prep-option', { hasText: 'Off' }).click()
    await page.locator('#rounds').fill('2')
    await page.locator('#round-duration').fill('00:20')
    await page.locator('#rest-duration').fill('00:10')
    await page.locator('#rest-duration').blur()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('timer-view')).toBeVisible()

    await page.keyboard.press('Space')
    await expect(phaseLabel(page, 'PAUSED')).toBeVisible()
    await page.keyboard.press('Space')
    await expect(phaseLabel(page, 'SPARRING')).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('button', { name: 'Skip Round' })).toBeVisible()
    await page.getByRole('button', { name: 'Skip Round' }).click()
    await expect(phaseLabel(page, 'REST')).toBeVisible()
  })
})
