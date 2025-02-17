import { useCallback, useEffect, useState } from 'react'

const useRecaptchaV3 = (siteKey) => {
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false)

  useEffect(() => {
    if (!siteKey) return;

    if (window.grecaptcha) {
      setIsRecaptchaReady(true)
    } else {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      script.async = true
      document.head.appendChild(script)
      script.onload = () => setIsRecaptchaReady(true)
    }
  }, [siteKey])

  const executeRecaptcha = useCallback(
    async (action) => {
      if (isRecaptchaReady && window.grecaptcha) {
        return await window.grecaptcha.execute(siteKey, { action })
      }
      return ''
    },
    [isRecaptchaReady, siteKey]
  )

  return executeRecaptcha
}

export default useRecaptchaV3
