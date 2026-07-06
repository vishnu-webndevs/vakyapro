import { useEffect, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type ApiKeyInfo = {
  has_key: boolean
  last_four: string | null
  updated_at: string | null
  has_backup: boolean
  is_decryptable: boolean
}

type ApiKeysResponse = {
  openai: ApiKeyInfo
  gemini: ApiKeyInfo
}

type Provider = 'openai' | 'gemini'

type AppSetting = {
  id: number
  setting_key: string
  setting_value: string | null
  updated_at: string | null
}

type StatusState = {
  saving: boolean
  testingProvider: Provider | null
  restoringProvider: Provider | null
  message: string | null
  messageType: 'success' | 'error' | null
}

type OnboardingSlide = {
  index: number
  active: boolean
  title: string
  text: string
  imageUrl: string
  imageFile: File | null
}

type SettingsSection = 'app_settings' | 'email_test' | 'api_keys'

export default function AdminSettings() {
  const [keys, setKeys] = useState<ApiKeysResponse | null>(null)
  const [openaiKeyInput, setOpenaiKeyInput] = useState('')
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [appSettings, setAppSettings] = useState<AppSetting[] | null>(null)
  const [uploadingSettingKey, setUploadingSettingKey] = useState<string | null>(null)
  const [onboardingSlides, setOnboardingSlides] = useState<OnboardingSlide[] | null>(null)
  const [savingSlideIndex, setSavingSlideIndex] = useState<number | null>(null)
  const [testMailTo, setTestMailTo] = useState('')
  const [testMailSubject, setTestMailSubject] = useState('')
  const [testMailMessage, setTestMailMessage] = useState('')
  const [sendingTestMail, setSendingTestMail] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('app_settings')
  const [status, setStatus] = useState<StatusState>({
    saving: false,
    testingProvider: null,
    restoringProvider: null,
    message: null,
    messageType: null,
  })

  const apiBaseUrl = getApiBaseUrl()

  const buildOnboardingSlidesFromSettings = (settings: AppSetting[]) => {
    const valuesByKey = new Map(settings.map((row) => [row.setting_key, row.setting_value ?? '']))
    const slideNumbers = new Set<number>()

    for (const row of settings) {
      const match = row.setting_key.match(/^onboarding_slide(\d+)_(title|text|image|active)$/)
      if (!match) continue
      const index = Number.parseInt(match[1], 10)
      if (Number.isFinite(index) && index > 0) slideNumbers.add(index)
    }

    const indices = Array.from(slideNumbers).sort((a, b) => a - b)
    return indices.map<OnboardingSlide>((index) => ({
      index,
      active: (() => {
        const raw = (valuesByKey.get(`onboarding_slide${index}_active`) ?? '').trim().toLowerCase()
        if (!raw) return true
        return !(raw === '0' || raw === 'false' || raw === 'inactive' || raw === 'off' || raw === 'no')
      })(),
      title: valuesByKey.get(`onboarding_slide${index}_title`) ?? '',
      text: valuesByKey.get(`onboarding_slide${index}_text`) ?? '',
      imageUrl: valuesByKey.get(`onboarding_slide${index}_image`) ?? '',
      imageFile: null,
    }))
  }

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const [keysResponse, appSettingsResponse] = await Promise.all([
          adminApiFetch(`${apiBaseUrl}/api/admin/settings/api-keys`, {
            signal: controller.signal,
          }),
          adminApiFetch(`${apiBaseUrl}/api/admin/settings/app-settings?prefix=onboarding_`, {
            signal: controller.signal,
          }),
        ])

        if (!keysResponse.ok) {
          throw new Error('Failed to load settings')
        }

        if (!appSettingsResponse.ok) {
          throw new Error('Failed to load app settings')
        }

        const keysData = (await keysResponse.json()) as ApiKeysResponse
        const appSettingsData = (await appSettingsResponse.json()) as { data: AppSetting[] }

        setKeys(keysData)
        setAppSettings(appSettingsData.data)
        setOnboardingSlides((prev) =>
          prev ?? buildOnboardingSlidesFromSettings(appSettingsData.data),
        )
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus({
          saving: false,
          testingProvider: null,
          restoringProvider: null,
          message: err instanceof Error ? err.message : 'Something went wrong',
          messageType: 'error',
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [apiBaseUrl])

  const upsertSetting = async (settingKey: string, settingValue: string | null) => {
    const response = await adminApiFetch(`${apiBaseUrl}/api/admin/settings/app-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setting_key: settingKey.trim(),
        setting_value: settingValue,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const firstError =
        data.errors &&
        Object.values<string[]>(data.errors)
          .flat()
          .join(' ')
      throw new Error(firstError || data.message || 'Failed to save app setting.')
    }

    const data = (await response.json()) as { data: AppSetting }

    setAppSettings((prev) => {
      const current = prev ?? []
      const idx = current.findIndex((row) => row.setting_key === data.data.setting_key)
      if (idx === -1) return [...current, data.data].sort((a, b) => a.setting_key.localeCompare(b.setting_key))
      const next = [...current]
      next[idx] = data.data
      return next
    })

    return data.data
  }

  const deleteAppSetting = async (appSettingId: number) => {
    const response = await adminApiFetch(
      `${apiBaseUrl}/api/admin/settings/app-settings/${appSettingId}`,
      {
        method: 'DELETE',
      },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to delete app setting.')
    }

    setAppSettings((prev) => (prev ?? []).filter((row) => row.id !== appSettingId))
  }

  const optimizeImageForUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return file
    if (file.type === 'image/svg+xml') return file
    if (file.size <= 450_000) return file

    const maxDimension = 1600
    const quality = 0.82

    const bitmap = await createImageBitmap(file).catch(() => null)
    if (!bitmap) return file

    const inputMax = Math.max(bitmap.width, bitmap.height)
    if (inputMax <= maxDimension) {
      if ('close' in bitmap) (bitmap as ImageBitmap).close()
      return file
    }

    const scale = maxDimension / inputMax
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      if ('close' in bitmap) (bitmap as ImageBitmap).close()
      return file
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    if ('close' in bitmap) (bitmap as ImageBitmap).close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) return file

    const safeBaseName = file.name.replace(/\.[^/.]+$/, '') || 'image'
    return new File([blob], `${safeBaseName}.jpg`, { type: 'image/jpeg' })
  }

  const uploadAppSettingFile = async (file: File, settingKey: string) => {
    setUploadingSettingKey(settingKey)
    setStatus((prev) => ({
      ...prev,
      message: null,
      messageType: null,
    }))

    try {
      const optimized = await optimizeImageForUpload(file)
      const formData = new FormData()
      formData.append('file', optimized)
      if (settingKey.trim()) {
        formData.append('setting_key', settingKey.trim())
      }

      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/settings/app-settings/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Failed to upload file.')
      }

      const data = (await response.json()) as { data: { url: string } }
      if (!data.data?.url) {
        throw new Error('Upload succeeded but URL is missing.')
      }

      return data.data.url
    } finally {
      setUploadingSettingKey(null)
    }
  }

  const handleAddSlide = () => {
    setOnboardingSlides((prev) => {
      const current = prev ?? []
      const maxIndex = current.reduce((acc, row) => Math.max(acc, row.index), 0)
      return [
        ...current,
        {
          index: maxIndex + 1,
          active: true,
          title: '',
          text: '',
          imageUrl: '',
          imageFile: null,
        },
      ]
    })
  }

  const handleSaveSlide = async (slide: OnboardingSlide) => {
    setSavingSlideIndex(slide.index)
    setStatus((prev) => ({
      ...prev,
      message: null,
      messageType: null,
    }))

    try {
      const imageKey = `onboarding_slide${slide.index}_image`
      const titleKey = `onboarding_slide${slide.index}_title`
      const textKey = `onboarding_slide${slide.index}_text`
      const activeKey = `onboarding_slide${slide.index}_active`

      let imageUrl = slide.imageUrl
      if (slide.imageFile) {
        imageUrl = await uploadAppSettingFile(slide.imageFile, imageKey)
        setOnboardingSlides((prev) =>
          (prev ?? []).map((row) =>
            row.index === slide.index ? { ...row, imageUrl, imageFile: null } : row,
          ),
        )
      }

      await Promise.all([
        upsertSetting(titleKey, slide.title || null),
        upsertSetting(textKey, slide.text || null),
        upsertSetting(imageKey, imageUrl || null),
        upsertSetting(activeKey, slide.active ? '1' : '0'),
      ])

      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: `Slide ${slide.index} saved.`,
        messageType: 'success',
      })
    } catch (err) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: err instanceof Error ? err.message : 'Something went wrong while saving slide.',
        messageType: 'error',
      })
    } finally {
      setSavingSlideIndex(null)
    }
  }

  const handleDeleteSlide = async (slide: OnboardingSlide) => {
    const confirmed = window.confirm(`Delete slide ${slide.index}? This cannot be undone.`)
    if (!confirmed) return

    setSavingSlideIndex(slide.index)
    setStatus((prev) => ({
      ...prev,
      message: null,
      messageType: null,
    }))

    try {
      const keysToDelete = new Set([
        `onboarding_slide${slide.index}_title`,
        `onboarding_slide${slide.index}_text`,
        `onboarding_slide${slide.index}_image`,
        `onboarding_slide${slide.index}_active`,
      ])

      const rowsToDelete = (appSettings ?? []).filter((row) => keysToDelete.has(row.setting_key))
      await Promise.all(rowsToDelete.map((row) => deleteAppSetting(row.id)))

      setOnboardingSlides((prev) => (prev ?? []).filter((row) => row.index !== slide.index))

      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: `Slide ${slide.index} deleted.`,
        messageType: 'success',
      })
    } catch (err) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: err instanceof Error ? err.message : 'Something went wrong while deleting slide.',
        messageType: 'error',
      })
    } finally {
      setSavingSlideIndex(null)
    }
  }

  const handleSendTestMail = async () => {
    if (!testMailTo.trim()) {
      setStatus((prev) => ({
        ...prev,
        message: 'Please enter a recipient email address.',
        messageType: 'error',
      }))
      return
    }

    setSendingTestMail(true)
    setStatus((prev) => ({
      ...prev,
      message: null,
      messageType: null,
    }))

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/settings/test-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testMailTo.trim(),
          subject: testMailSubject.trim() || null,
          message: testMailMessage.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Failed to send test email.')
      }

      setStatus((prev) => ({
        ...prev,
        message: 'Test email sent.',
        messageType: 'success',
      }))
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        message: err instanceof Error ? err.message : 'Something went wrong while sending test email.',
        messageType: 'error',
      }))
    } finally {
      setSendingTestMail(false)
    }
  }

  const handleSave = async () => {
    if (!openaiKeyInput && !geminiKeyInput) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: 'Please enter at least one API key to save.',
        messageType: 'error',
      })
      return
    }

    const confirmed = window.confirm(
      'You are about to update API keys. This will rotate keys and may affect live traffic. Continue?',
    )
    if (!confirmed) return

    setStatus({
      saving: true,
      testingProvider: null,
      restoringProvider: null,
      message: null,
      messageType: null,
    })

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/settings/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openai_key: openaiKeyInput || null,
          gemini_key: geminiKeyInput || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Failed to save API keys')
      }

      const data = (await response.json()) as ApiKeysResponse
      setKeys(data)
      setOpenaiKeyInput('')
      setGeminiKeyInput('')
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: 'API keys updated successfully.',
        messageType: 'success',
      })
    } catch (err) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: err instanceof Error ? err.message : 'Something went wrong while saving.',
        messageType: 'error',
      })
    }
  }

  const handleTest = async (provider: Provider, key: string) => {
    const effectiveKey = key || (provider === 'openai' ? openaiKeyInput : geminiKeyInput)

    if (!effectiveKey) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: 'Enter an API key before testing.',
        messageType: 'error',
      })
      return
    }

    setStatus({
      saving: false,
      testingProvider: provider,
      restoringProvider: null,
      message: null,
      messageType: null,
    })

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/settings/api-keys/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, key: effectiveKey }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Test request failed.')
      }

      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: `${provider === 'openai' ? 'OpenAI' : 'Gemini'} connection successful.`,
        messageType: 'success',
      })
    } catch (err) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message:
          err instanceof Error ? err.message : 'Something went wrong while testing the key.',
        messageType: 'error',
      })
    }
  }

  const handleRestore = async (provider: Provider) => {
    const confirmed = window.confirm(
      'This will restore the previous API key for this provider. Continue?',
    )
    if (!confirmed) return

    setStatus({
      saving: false,
      testingProvider: null,
      restoringProvider: provider,
      message: null,
      messageType: null,
    })

    try {
      const response = await adminApiFetch(
        `${apiBaseUrl}/api/admin/settings/api-keys/restore`,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
        },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to restore API key.')
      }

      const data = (await response.json()) as ApiKeysResponse
      setKeys(data)
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message: 'Previous API key restored.',
        messageType: 'success',
      })
    } catch (err) {
      setStatus({
        saving: false,
        testingProvider: null,
        restoringProvider: null,
        message:
          err instanceof Error ? err.message : 'Something went wrong while restoring the key.',
        messageType: 'error',
      })
    }
  }

  const renderProviderCard = (provider: Provider, title: string, description: string) => {
    const info = keys?.[provider]
    const isTesting = status.testingProvider === provider
    const isRestoring = status.restoringProvider === provider

    const value = provider === 'openai' ? openaiKeyInput : geminiKeyInput
    const setter = provider === 'openai' ? setOpenaiKeyInput : setGeminiKeyInput

    return (
      <Card
        title={title}
        subtitle={description}
      >
        <div className="space-y-3">
          {info && info.has_key && (
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>
                Current key:{' '}
                <span className="font-mono">
                  ••••••••
                  {info.last_four}
                </span>
              </span>
              {info.updated_at && (
                <span>Updated {new Date(info.updated_at).toLocaleString()}</span>
              )}
            </div>
          )}
          {info && info.has_key && !info.is_decryptable && (
            <div className="rounded-lg border border-rose-600/60 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-100">
              Saved key can&apos;t be decrypted on this server. This usually happens if APP_KEY was
              changed after saving. Please re-save the key.
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs text-slate-300">
              {title} API key
            </label>
            <input
              type="password"
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={provider === 'openai' ? 'sk-...' : 'AIza...'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <p className="text-[11px] text-slate-500">
              Keys are encrypted at rest. They are never shown in plain text after saving.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTest(provider, value)}
              disabled={isTesting}
              className="inline-flex items-center rounded-lg border border-sky-600/70 bg-sky-900/30 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-900/60 disabled:opacity-60"
            >
              {isTesting ? 'Testing…' : 'Test connection'}
            </button>
            {info && info.has_backup && (
              <button
                type="button"
                onClick={() => handleRestore(provider)}
                disabled={isRestoring}
                className="inline-flex items-center rounded-lg border border-amber-600/70 bg-amber-900/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/60 disabled:opacity-60"
              >
                {isRestoring ? 'Restoring…' : 'Restore previous key'}
              </button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Settings"
        subtitle="Manage API credentials and mobile app content settings."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Settings', isCurrent: true },
        ]}
      />

      {status.message && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            status.messageType === 'success'
              ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-100'
              : 'border-rose-600/70 bg-rose-950/40 text-rose-100'
          }`}
        >
          {status.message}
        </div>
      )}

      {!keys && (
        <p className="text-sm text-slate-400">Loading settings…</p>
      )}

      {keys && (
        <>
          <div className="grid gap-4 lg:grid-cols-[240px,1fr]">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-2">
              <div className="px-2 py-2 text-xs font-semibold text-slate-300">Settings</div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSettingsSection('app_settings')}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    settingsSection === 'app_settings'
                      ? 'bg-sky-600/20 text-sky-100'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  App Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSection('email_test')}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    settingsSection === 'email_test'
                      ? 'bg-sky-600/20 text-sky-100'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Email test
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSection('api_keys')}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    settingsSection === 'api_keys'
                      ? 'bg-sky-600/20 text-sky-100'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Api Key&apos;s
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {settingsSection === 'api_keys' && (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={status.saving}
                      className="inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-indigo-700 disabled:opacity-60"
                    >
                      {status.saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {renderProviderCard(
                      'openai',
                      'OpenAI',
                      'Used for GPT-style models. Store your OpenAI API key securely.',
                    )}
                    {renderProviderCard(
                      'gemini',
                      'Gemini',
                      'Used for Google Gemini models. Store your Gemini API key securely.',
                    )}
                  </div>
                </>
              )}

              {settingsSection === 'app_settings' && (
                <Card
                  title="App Settings"
                  subtitle="These values are used by the mobile app (e.g., onboarding text/images)."
                >
                  {!appSettings && <p className="text-sm text-slate-400">Loading app settings…</p>}

                  {appSettings && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-100">Onboarding Slides</div>
                            <div className="mt-1 text-xs text-slate-400">
                              Title + text + image ek hi slide me manage karo (auto keys: onboarding_slideN_title/text/image).
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddSlide}
                            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700/70"
                          >
                            Add slide
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(onboardingSlides ?? []).length === 0 && (
                            <div className="text-xs text-slate-400">No slides found.</div>
                          )}

                          {(onboardingSlides ?? []).map((slide) => (
                            <div
                              key={slide.index}
                              className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="text-xs font-semibold text-slate-300">
                                    Slide {slide.index}
                                  </div>
                                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={slide.active}
                                      onChange={(e) =>
                                        setOnboardingSlides((prev) =>
                                          (prev ?? []).map((row) =>
                                            row.index === slide.index
                                              ? { ...row, active: e.target.checked }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-500"
                                    />
                                    Active
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteSlide(slide)}
                                    disabled={savingSlideIndex === slide.index}
                                    className="inline-flex items-center rounded-lg border border-rose-600/70 bg-rose-900/20 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-900/40 disabled:opacity-60"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveSlide(slide)}
                                    disabled={
                                      savingSlideIndex === slide.index ||
                                      uploadingSettingKey === `onboarding_slide${slide.index}_image`
                                    }
                                    className="inline-flex items-center rounded-lg border border-sky-600/70 bg-sky-900/30 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-900/60 disabled:opacity-60"
                                  >
                                    {savingSlideIndex === slide.index
                                      ? 'Saving…'
                                      : uploadingSettingKey === `onboarding_slide${slide.index}_image`
                                        ? 'Uploading…'
                                        : 'Save slide'}
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-2 md:grid-cols-3">
                                <input
                                  value={slide.title}
                                  onChange={(e) =>
                                    setOnboardingSlides((prev) =>
                                      (prev ?? []).map((row) =>
                                        row.index === slide.index
                                          ? { ...row, title: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                  placeholder="title"
                                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                />
                                <input
                                  value={slide.text}
                                  onChange={(e) =>
                                    setOnboardingSlides((prev) =>
                                      (prev ?? []).map((row) =>
                                        row.index === slide.index
                                          ? { ...row, text: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                  placeholder="text"
                                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                />
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setOnboardingSlides((prev) =>
                                        (prev ?? []).map((row) =>
                                          row.index === slide.index
                                            ? { ...row, imageFile: e.target.files?.[0] ?? null }
                                            : row,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                  />
                                  <input
                                    value={slide.imageUrl}
                                    onChange={(e) =>
                                      setOnboardingSlides((prev) =>
                                        (prev ?? []).map((row) =>
                                          row.index === slide.index
                                            ? { ...row, imageUrl: e.target.value }
                                            : row,
                                        ),
                                      )
                                    }
                                    placeholder="image url"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {settingsSection === 'email_test' && (
                <Card
                  title="Email"
                  subtitle="Send a test email to verify SMTP settings."
                >
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-xs text-slate-300">To</label>
                        <input
                          value={testMailTo}
                          onChange={(e) => setTestMailTo(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs text-slate-300">Subject</label>
                        <input
                          value={testMailSubject}
                          onChange={(e) => setTestMailSubject(e.target.value)}
                          placeholder="VakyaPro Test Email"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-slate-300">Message</label>
                      <textarea
                        value={testMailMessage}
                        onChange={(e) => setTestMailMessage(e.target.value)}
                        placeholder="This is a test email from VakyaPro."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleSendTestMail()}
                        disabled={sendingTestMail}
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700/70 disabled:opacity-60"
                      >
                        {sendingTestMail ? 'Sending…' : 'Send test email'}
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
