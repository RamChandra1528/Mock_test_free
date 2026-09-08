import { CheckCircle2, CircleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Toast = { id: number; message: string; type: "success" | "error" };
const ToastContext = createContext<{
  show: (message: string, type?: Toast["type"]) => void;
} | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now();
      setToasts((t) => [...t, { id, message, type }]);
      window.setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        3500,
      );
    },
    [],
  );
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl ${toast.type === "success" ? "border-emerald-200 bg-white text-emerald-900" : "border-rose-200 bg-white text-rose-900"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span className="flex-1 text-sm font-semibold">
              {toast.message}
            </span>
            <button
              aria-label="Dismiss"
              onClick={() =>
                setToasts((t) => t.filter((x) => x.id !== toast.id))
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error("ToastProvider is missing");
  return value;
};
