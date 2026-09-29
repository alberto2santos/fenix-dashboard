import { expect, test } from '@playwright/test'

test('imports a CSV, displays calculated KPIs, and exports a local PDF when the API is offline', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('region', { name: 'Ingestão em tempo real' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Alertas configuráveis' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Histórico de paradas e retrabalho' })).toHaveCount(0)

  await page.getByText('Ferramentas opcionais').click()
  const realtimeToggle = page.getByRole('checkbox', { name: /Ingestão em tempo real/ })
  await realtimeToggle.check()
  await expect(page.getByRole('region', { name: 'Ingestão em tempo real' })).toBeVisible()
  await realtimeToggle.uncheck()
  await expect(page.getByRole('region', { name: 'Ingestão em tempo real' })).toHaveCount(0)

  const csv = [
    'area,soldas_realizadas,saldo_soldas,total_previsto,porcentagem,data_referencia,turno',
    'AREA-A,90,60,150,60,2026-03-02,A',
  ].join('\n')

  await page.locator('input[type="file"]').setInputFiles({
    name: 'snapshot.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })

  await expect(page.getByRole('article', { name: 'Avanço Real: 60.0%' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Soldas Realizadas: 90' })).toBeVisible()
  await expect(page.getByText('Avanço total de soldas do projeto')).toBeVisible()

  await page.getByRole('button', { name: 'Ir para resultados' }).click()
  await expect(page.locator('#dashboard-results')).toBeInViewport()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar dashboard como PDF' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
})
