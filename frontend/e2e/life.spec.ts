import { test, expect } from '@playwright/test';

test.describe('中式人生模拟器', () => {
  test('首页显示正确并有开始按钮', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=中式人生模拟器')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始新人生' })).toBeVisible();
  });

  test('点击开始新人生进入游戏页面', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);
    // 等待页面加载完成（状态栏出现）
    await expect(page.locator('text=/人生 #/')).toBeVisible();
    await expect(page.locator('text=/岁/')).toBeVisible();
  });

  test('可以完整玩一年并查看结果', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);

    // 等待页面加载完成
    await expect(page.locator('text=/岁/')).toBeVisible();
    await expect(page.locator('text=加载人生中...')).toHaveCount(0);

    // 点击开始人生 / 下一年
    await page.getByRole('button', { name: /开始人生|下一年/ }).first().click();

    // 等待出现选项或无选项事件的继续按钮
    const optionBtn = page.locator('button:has-text("选这个 →")').first();
    const continueBtn = page.getByRole('button', { name: '继续下一年' }).first();
    await expect(optionBtn.or(continueBtn)).toBeVisible({ timeout: 5000 });

    if (await optionBtn.isVisible()) {
      await optionBtn.click();
      await expect(page.locator('text=结果如下')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: '继续下一年' }).click();
    } else {
      await continueBtn.click();
    }

    // 等待页面进入下一年状态（可能是新事件、平淡的一年、或再次显示下一年按钮）
    await expect(
      page.getByRole('button', { name: /继续下一年|下一年|开始人生/ }).first()
    ).toBeVisible();
  });

  test('右侧人生轨迹面板会记录历史', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);

    // 等待页面加载完成
    await expect(page.locator('text=/岁/')).toBeVisible();

    await page.getByRole('button', { name: /开始人生|下一年/ }).first().click();

    const optionBtn = page.locator('button:has-text("选这个 →")').first();
    const continueBtn = page.getByRole('button', { name: '继续下一年' }).first();
    await expect(optionBtn.or(continueBtn)).toBeVisible({ timeout: 5000 });

    if (await optionBtn.isVisible()) {
      await optionBtn.click();
      await expect(page.locator('text=结果如下')).toBeVisible({ timeout: 5000 });
    }

    // 检查右侧轨迹有记录（至少有一年）
    await expect(page.getByRole('heading', { name: /人生轨迹/ })).toBeVisible();
    await expect(page.locator('text=/出生|平淡的一年|选择了/').first()).toBeVisible();
  });

  test('AI 事件生成按钮存在并可点击', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);

    // 等待页面加载完成
    await expect(page.locator('text=/岁/')).toBeVisible();

    // AI 按钮在初始状态就存在
    const aiBtn = page.getByRole('button', { name: '来点意外的' }).first();
    await expect(aiBtn).toBeVisible();

    // 直接点击 AI 按钮（不需要先玩一年）
    await aiBtn.click();

    // 应该看到 toast 提示（AI 生成成功或提示限制/未配置/API key 未设置）
    await expect(
      page.locator('text=/AI 事件已生成|AI 生成失败|每3年最多|未配置|DASHSCOPE_API_KEY/').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('今日金句会显示在交互区下方', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);

    // 等待页面加载完成
    await expect(page.locator('text=/岁/')).toBeVisible();

    await page.getByRole('button', { name: /开始人生|下一年/ }).first().click();

    const optionBtn = page.locator('button:has-text("选这个 →")').first();
    const continueBtn = page.getByRole('button', { name: '继续下一年' }).first();
    await expect(optionBtn.or(continueBtn)).toBeVisible({ timeout: 5000 });

    if (await optionBtn.isVisible()) {
      await optionBtn.click();
      await expect(page.locator('text=结果如下')).toBeVisible({ timeout: 5000 });
    }

    // 结果页面或无选项事件页面都应该有今日金句
    await expect(page.locator('text=今日金句')).toBeVisible();
  });

  test('结束人生按钮可点击并返回首页', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始新人生' }).click();
    await page.waitForURL(/\/life\/\d+/);

    // 等待页面加载完成
    await expect(page.locator('text=/岁/')).toBeVisible();

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog'),
      page.getByRole('button', { name: '结束人生' }).click(),
    ]);
    await dialog.accept();

    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('text=中式人生模拟器')).toBeVisible();
  });
});
