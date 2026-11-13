import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

/** Modal dialog built on the native <dialog> element (focus trap, Esc to close). */
export function Dialog({ title, onClose, children, actions }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      <form method="dialog" onSubmit={(e) => e.preventDefault()}>
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          {actions}
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Close</button>
        </div>
      </form>
    </dialog>
  );
}
