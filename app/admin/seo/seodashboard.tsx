'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

function HealthIcon({ status }: { status: 'good' | 'warning' | 'critical' }) {
  if (status === 'good') return <CheckCircle2 className="h-5 w-5 text-green-500" />
  if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-amber-500" />
  return <XCircle className="h-5 w-5 text-red-500" />
}

function HealthBar({ label, ready, total, score, status, details }: {
  label: string
  ready: number
  total: number
  score: number
  status: 'good' | 'warning' | 'critical'
  details: { withTitle: number; withDescription: number; withOgImage: number; missingTitle: number; missingDescription: number; missingOgImage: number }
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HealthIcon status={status} />
          <div>
            <div className="font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">
              {ready} из {total} готовы ({score}%)
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-1">
        <Progress value={score} className="h-2" />
      </div>

      {showDetails && (
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded bg-green-50 dark:bg-green-950/30 p-2">
              <div className="font-semibold text-green-600 dark:text-green-400">{details.withTitle}</div>
              <div className="text-muted-foreground">Title</div>
            </div>
            <div className="rounded bg-green-50 dark:bg-green-950/30 p-2">
              <div className="font-semibold text-green-600 dark:text-green-400">{details.withDescription}</div>
              <div className="text-muted-foreground">Description</div>
            </div>
            <div className="rounded bg-green-50 dark:bg-green-950/30 p-2">
              <div className="font-semibold text-green-600 dark:text-green-400">{details.withOgImage}</div>
              <div className="text-muted-foreground">OG Image</div>
            </div>
          </div>
          {(details.missingTitle > 0 || details.missingDescription > 0 || details.missingOgImage > 0) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {details.missingTitle > 0 && <div>• Не хватает title: {details.missingTitle}</div>}
              {details.missingDescription > 0 && <div>• Не хватает description: {details.missingDescription}</div>}
              {details.missingOgImage > 0 && <div>• Не хватает OG image: {details.missingOgImage}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuickFixResult({ result }: {
  result: {
    success: boolean
    completedAt: string
    titlesAdded: number
    descriptionsAdded: number
    ogImagesAdded: number
    snippetsApplied: number
    totalApplied: number
    totalProcessed: number
    errors: number
  }
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-800 dark:text-green-300">
            SEO исправлено успешно
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.titlesAdded}</div>
            <div className="text-xs text-muted-foreground">Title добавлено</div>
          </div>
          <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.descriptionsAdded}</div>
            <div className="text-xs text-muted-foreground">Description добавлено</div>
          </div>
          <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.ogImagesAdded}</div>
            <div className="text-xs text-muted-foreground">OG image добавлено</div>
          </div>
          <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.totalApplied}</div>
            <div className="text-xs text-muted-foreground">Всего обновлено</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? 'Скрыть детали' : 'Показать детали'}
        </Button>

        {showDetails && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Обработано записей: {result.totalProcessed}</div>
            <div>Сниппетов применено: {result.snippetsApplied}</div>
            {result.errors > 0 && <div className="text-red-500">Ошибок: {result.errors}</div>}
            <div>Завершено: {new Date(result.completedAt).toLocaleString('ru-RU')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SeoDashboard() {
  const [showPreview, setShowPreview] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    completedAt: string
    titlesAdded: number
    descriptionsAdded: number
    ogImagesAdded: number
    snippetsApplied: number
    totalApplied: number
    totalProcessed: number
    errors: number
  } | null>(null)

  const utils = trpc.useUtils()
  const { data: summary, isLoading: isSummaryLoading } = trpc.seo.getSummary.useQuery()
  const { data: history, isLoading: isHistoryLoading } = trpc.seo.getQuickFixHistory.useQuery()
  const { data: previewData, isFetching: isPreviewing, refetch: runPreview } = trpc.seo.quickFixPreview.useQuery(
    undefined,
    { enabled: false }
  )

  const { mutateAsync: runQuickFix, isPending: isFixing } = trpc.seo.quickFix.useMutation({
    onSuccess: (result) => {
      toast.success(`SEO обновлено: ${result.titlesAdded} title, ${result.descriptionsAdded} description`)
      setLastResult(result)
      setShowPreview(false)
      void utils.seo.getSummary.invalidate()
      void utils.seo.getQuickFixHistory.invalidate()
    },
    onError: (err) => {
      toast.error(err.message ?? 'Не удалось исправить SEO')
    },
  })

  const handlePreview = async () => {
    const result = await runPreview()
    setShowPreview(true)
    if (result.data) {
      toast.info(`Будет обновлено: ${result.data.totalWillBeAffected} записей`)
    }
  }

  const handleFix = async () => {
    await runQuickFix({ mode: 'safe-overwrite' })
  }

  const overallScore = summary?.overallScore ?? 0
  const overallStatus = overallScore >= 90 ? 'good' : overallScore >= 60 ? 'warning' : 'critical'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Здоровье</h1>
          <p className="text-sm text-muted-foreground">
            Общий показатель: <span className={overallStatus === 'good' ? 'text-green-600' : overallStatus === 'warning' ? 'text-amber-600' : 'text-red-600'}>{overallScore}%</span>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/admin/seo/advanced">
            <Settings className="h-4 w-4" />
            Продвинутые опции
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {isSummaryLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <HealthBar
            label="Товары"
            ready={summary.product.withTitle}
            total={summary.product.total}
            score={summary.product.score}
            status={summary.product.status}
            details={summary.product}
          />
          <HealthBar
            label="Категории"
            ready={summary.category.withTitle}
            total={summary.category.total}
            score={summary.category.score}
            status={summary.category.status}
            details={summary.category}
          />
          <HealthBar
            label="Страницы"
            ready={summary.page.withTitle}
            total={summary.page.total}
            score={summary.page.score}
            status={summary.page.status}
            details={summary.page}
          />
        </div>
      ) : null}

      <Separator />

      <div className="space-y-4">
        {!showPreview ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handlePreview}
              disabled={isPreviewing || isFixing}
            >
              {isPreviewing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              {isPreviewing ? 'Анализируем...' : 'Исправить всё SEO'}
            </Button>
          </div>
        ) : (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-medium">Проверьте перед применением</span>
              </div>

              {previewData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
                    <div className="text-lg font-bold">{previewData.totalWillBeAffected}</div>
                    <div className="text-xs text-muted-foreground">Будет обновлено</div>
                  </div>
                  <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
                    <div className="text-lg font-bold">{previewData.titlesWillBeAdded}</div>
                    <div className="text-xs text-muted-foreground">Title</div>
                  </div>
                  <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
                    <div className="text-lg font-bold">{previewData.descriptionsWillBeAdded}</div>
                    <div className="text-xs text-muted-foreground">Description</div>
                  </div>
                  <div className="rounded bg-white dark:bg-black/20 p-3 text-center">
                    <div className="text-lg font-bold">{previewData.ogImagesWillBeAdded}</div>
                    <div className="text-xs text-muted-foreground">OG image</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Рассчитываем...
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPreview(false)}
                  disabled={isFixing}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleFix}
                  disabled={isFixing || !previewData || previewData.totalWillBeAffected === 0}
                >
                  {isFixing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isFixing ? 'Применяем...' : 'Подтвердить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {lastResult && <QuickFixResult result={lastResult} />}
      </div>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">История исправлений</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.items.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        item.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }
                    >
                      {item.status === 'COMPLETED' ? 'Успешно' : 'Частично'}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{item.titlesAdded} title, +{item.descriptionsAdded} desc, +{item.ogImagesAdded} OG
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Пока нет истории исправлений. Нажмите «Исправить всё SEO» для первого запуска.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
