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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

async function expectCountdownCentered(page: Page, viewportWidth: number): Promise<void> {
  const box = await page.getByTestId('countdown').boundingBox()
  expect(box).toBeTruthy()
  const center = box!.x + box!.width / 2
  expect(Math.abs(center - viewportWidth / 2)).toBeLessThan(viewportWidth * 0.12)
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

  test('preset changes update round and rest times', async ({ page }) => {
    await page.goto('/')
    await page.locator('.presets__item', { hasText: 'BJJ' }).click()
    await expect(page.locator('#round-duration')).toHaveValue('06:00')
    await expect(page.locator('#rest-duration')).toHaveValue('01:30')

    await page.locator('.presets__item', { hasText: 'MMA' }).click()
    await expect(page.locator('#round-duration')).toHaveValue('05:00')
    await expect(page.locator('#rest-duration')).toHaveValue('01:00')

    await page
      .locator('.presets__item', { hasText: 'Boxing' })
      .filter({ hasNotText: 'Amateur' })
      .click()
    await expect(page.locator('#round-duration')).toHaveValue('03:00')
    await expect(page.locator('#rest-duration')).toHaveValue('01:00')
  })

  test('stacks round controls on iPhone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByTestId('setup-view')).toBeVisible()
    const layout = await page.evaluate(() => {
      const round = document.querySelector('#round-duration')?.closest('.duration')
      const rest = document.querySelector('#rest-duration')?.closest('.duration')
      if (!round || !rest) return null
      const roundBox = round.getBoundingClientRect()
      const restBox = rest.getBoundingClientRect()
      return {
        roundTop: roundBox.top,
        restTop: restBox.top,
        roundWidth: roundBox.width,
      }
    })
    expect(layout).toBeTruthy()
    expect(layout!.restTop).toBeGreaterThan(layout!.roundTop + 20)
    expect(layout!.roundWidth).toBeGreaterThan(280)
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

    const controlTops = await page.locator('.controls__btn').evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().top),
    )
    expect(controlTops.length).toBeGreaterThan(0)
    expect(Math.max(...controlTops) - Math.min(...controlTops)).toBeLessThan(8)

    await page.setViewportSize({ width: 1366, height: 768 })
    await expect(timer).toBeVisible()
    await expect(page.getByTestId('countdown')).toBeVisible()
    await expect(page.getByTestId('pause-resume')).toBeVisible()
    await expectCountdownCentered(page, 1366)
  })

  test('setup does not overflow on a small phone or phone landscape', async ({ page }) => {
    for (const size of [
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size)
      await page.goto('/')
      await expect(page.getByTestId('setup-view')).toBeVisible()
      await expect(page.getByTestId('start-timer')).toBeInViewport()
      await expectNoHorizontalOverflow(page)

      if (size.width <= 520) {
        await expect(page.locator('.setup__settings-copy')).toBeHidden()
      }
    }
  })

  test('wraps presets and centers the timer on tablet and desktop', async ({ page }) => {
    for (const size of [
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(size)
      await page.goto('/')
      const presets = await page.locator('.presets__grid').evaluate((grid) => {
        const style = getComputedStyle(grid)
        return {
          wrap: style.flexWrap,
          overflows: grid.scrollWidth > grid.clientWidth + 1,
        }
      })
      expect(presets.wrap).toBe('wrap')
      expect(presets.overflows).toBe(false)

      await page.locator('label.setup__prep-option', { hasText: 'Off' }).click()
      await page.getByTestId('start-timer').click()
      await expect(page.getByTestId('timer-view')).toBeVisible()
      await expectCountdownCentered(page, size.width)
      await expectNoHorizontalOverflow(page)
    }
  })

  test('hides round dots when there are more than twelve rounds', async ({ page }) => {
    await page.goto('/')
    await page.locator('#rounds').fill('20')
    await page.locator('#rounds').blur()
    await page.locator('label.setup__prep-option', { hasText: 'Off' }).click()
    await page.getByTestId('start-timer').click()
    await expect(page.getByTestId('timer-view')).toBeVisible()
    await expect(page.locator('.progress__dot')).toHaveCount(0)
    await expect(page.getByTestId('round-label')).toContainText('Round 1 of 20')
  })

  test('escape closes only the sound dialog', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('open-settings').click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.getByTestId('choose-sounds').click()
    await expect(page.getByRole('heading', { name: 'Sound Effects' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Sound Effects' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
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
