import { X } from 'lucide-react'
import { useToast } from '../store/toast'

export default function Toaster() {
  const messages = useToast((state) => state.messages)
  const dismiss = useToast((state) => state.dismiss)

  return (
    <div className="toaster" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={`toast toast--${message.tone}`}>
          <span>{message.message}</span>
          <button type="button" onClick={() => dismiss(message.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}