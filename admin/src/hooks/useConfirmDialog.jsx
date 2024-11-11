import { useState } from 'react'

const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [resolveFunc, setResolveFunc] = useState(null)

  const openDialog = () => {
    setIsOpen(true)
    return new Promise((resolve) => {
      setResolveFunc(() => resolve)
    })
  }

  const handleConfirm = () => {
    if (resolveFunc) {
      resolveFunc(true)
      setIsOpen(false)
      setResolveFunc(null)
    }
  }

  const handleCancel = () => {
    if (resolveFunc) {
      resolveFunc(false)
      setIsOpen(false)
      setResolveFunc(null)
    }
  }

  return { isOpen, openDialog, handleConfirm, handleCancel }
}

export default useConfirmDialog
