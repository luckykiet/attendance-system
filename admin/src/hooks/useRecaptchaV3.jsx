import { useCallback, useEffect, useState } from 'react'

const useRecaptchaV3 = (siteKey, isUsingRecaptcha = true) => {
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false)

  useEffect(() => {
    if (!isUsingRecaptcha) return

    if (window.grecaptcha) {
      setIsRecaptchaReady(true)
    } else {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      script.async = true
      document.head.appendChild(script)
      script.onload = () => setIsRecaptchaReady(true)
    }
  }, [siteKey, isUsingRecaptcha])

  const executeRecaptcha = useCallback(
    async (action) => {
      if (isUsingRecaptcha && isRecaptchaReady && window.grecaptcha) {
        return await window.grecaptcha.execute(siteKey, { action })
      }
      return null
    },
    [isUsingRecaptcha, isRecaptchaReady, siteKey]
  )

  return executeRecaptcha
}

export default useRecaptchaV3
