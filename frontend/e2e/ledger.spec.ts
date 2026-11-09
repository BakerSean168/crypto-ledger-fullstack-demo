import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.connection-state')).toContainText('API 已连接')
})

test('uses the real API for first and second pages', async ({ page }) => {
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('.table-count')).toHaveText('3')
  await expect(page.locator('tbody tr').first()).toContainText('#0004')

  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr').first()).toContainText('#0001')

  await page.getByRole('button', { name: '上一页' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
})

test('asset filter shows only ETH while keeping a full matching summary', async ({ page }) => {
  await page.getByRole('combobox', { name: '资产类型' }).selectOption('ETH')
  await expect(page.locator('.table-count')).toHaveText('2')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('tbody tr').nth(0)).toContainText('ETH')
  await expect(page.locator('tbody tr').nth(1)).toContainText('ETH')
  await expect(page.locator('.summary-card')).toHaveCount(1)
})

test('inclusive UTC dates include the entire chosen end day', async ({ page }) => {
  await page.getByLabel('开始日期（UTC）').fill('2026-11-01')
  await page.getByLabel('结束日期（UTC）').fill('2026-11-03')
  await page.getByRole('button', { name: '查询记录' }).click()
  await expect(page.locator('.table-count')).toHaveText('2')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('tbody tr').first()).toContainText('#0002')
  await expect(page.locator('tbody tr').last()).toContainText('#0001')
})

test('sample wallets, empty results and required-field validation', async ({ page }) => {
  await page.getByRole('button', { name: '0xdef' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr').first()).toContainText('0xdef')

  await page.getByLabel('钱包地址').fill('0xunknown')
  await page.getByRole('button', { name: '查询记录' }).click()
  await expect(page.getByText('没有找到交易记录')).toBeVisible()

  await page.getByLabel('钱包地址').fill('')
  await page.getByRole('button', { name: '查询记录' }).click()
  await expect(page.getByText('请输入钱包地址。')).toBeVisible()
})
