// src/components/ui/Toast.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	ReactNode
} from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
	id: string
	type: ToastType
	message: string
	duration?: number
}

interface ToastContextValue {
	toasts: Toast[]
	addToast: (toast: Omit<Toast, 'id'>) => void
	removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
	const context = useContext(ToastContext)
	if (!context) {
		// Return a no-op if not in provider (for SSR safety)
		return {
			toasts: [],
			addToast: () => {},
			removeToast: () => {}
		}
	}
	return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])

	const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 9)
		setToasts((prev) => [...prev, { ...toast, id }])
	}, [])

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast }}>
			{children}
		</ToastContext.Provider>
	)
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
	useEffect(() => {
		const duration = toast.duration ?? 5000
		const timer = setTimeout(onRemove, duration)
		return () => clearTimeout(timer)
	}, [toast.duration, onRemove])

	const icons = {
		success: <CheckCircle size={18} className="text-green-400" />,
		error: <AlertCircle size={18} className="text-red-400" />,
		warning: <AlertTriangle size={18} className="text-yellow-400" />,
		info: <Info size={18} className="text-cyan-400" />
	}

	const colors = {
		success: 'border-green-500/30 bg-green-500/10',
		error: 'border-red-500/30 bg-red-500/10',
		warning: 'border-yellow-500/30 bg-yellow-500/10',
		info: 'border-cyan-500/30 bg-cyan-500/10'
	}

	return (
		<div
			className={cn(
				'flex items-start gap-3 p-4 bg-gray-900 border rounded-lg shadow-lg min-w-[300px] max-w-[400px]',
				colors[toast.type]
			)}
		>
			{icons[toast.type]}
			<p className="flex-1 text-sm text-white">{toast.message}</p>
			<button
				onClick={onRemove}
				className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded"
			>
				<X size={14} />
			</button>
		</div>
	)
}

export function ToastContainer() {
	const { toasts, removeToast } = useToast()

	if (toasts.length === 0) return null

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<ToastItem
					key={toast.id}
					toast={toast}
					onRemove={() => removeToast(toast.id)}
				/>
			))}
		</div>
	)
}
