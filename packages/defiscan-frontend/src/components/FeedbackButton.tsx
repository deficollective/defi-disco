import { useEffect, useCallback } from 'react'

const TALLY_FORM_ID = 'REPLACE_WITH_YOUR_FORM_ID'

declare global {
  interface Window {
    Tally?: {
      openPopup: (
        formId: string,
        options?: {
          layout?: 'default' | 'modal'
          width?: number
          autoClose?: number
          hideTitle?: boolean
          overlay?: boolean
          emoji?: { text: string; animation: string }
          onOpen?: () => void
          onClose?: () => void
          onPageView?: (page: number) => void
          onSubmit?: (payload: unknown) => void
        },
      ) => void
      loadEmbeds: () => void
    }
  }
}

export function FeedbackButton() {
  useEffect(() => {
    if (document.querySelector('script[src*="tally.so"]')) return

    const script = document.createElement('script')
    script.src = 'https://tally.so/widgets/embed.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  const openFeedback = useCallback(() => {
    if (window.Tally) {
      window.Tally.openPopup(TALLY_FORM_ID, {
        layout: 'modal',
        width: 500,
        overlay: true,
        hideTitle: false,
      })
    } else {
      window.open(`https://tally.so/r/${TALLY_FORM_ID}`, '_blank')
    }
  }, [])

  return (
    <button
      onClick={openFeedback}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl active:scale-95"
      aria-label="Send feedback"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
          clipRule="evenodd"
        />
      </svg>
      Feedback
    </button>
  )
}
