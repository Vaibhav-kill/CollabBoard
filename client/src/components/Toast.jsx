import { useEffect, useState } from 'react';

let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, duration = 2500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  };

  return { toasts, addToast };
}

export { useToasts };

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  );
}
