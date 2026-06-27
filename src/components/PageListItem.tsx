import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { deletePage, setActivePage } from "../store/pageSlice";

export default function PageListItem({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const title = useAppSelector(
    (s) => s.pages.list.find((p) => p.id === id)?.title ?? "",
  );

  const active = useAppSelector((s) => s.pages.activePageId) === id;

  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleDeleteClick = () => {
    if (confirming) {
      // second click -> commit. Clear the pending timer.
      if (timerRef.current) clearTimeout(timerRef.current);
      dispatch(deletePage(id));
      return;
    }

    // first click -> arm, and schedule auto-disarm
    setConfirming(true);
    timerRef.current = window.setTimeout(() => {
      setConfirming(false);
      timerRef.current = null;
    }, 3000);
  };

  // safety net: if the row unmounts while a timer is pending
  // (e.g. the user deletes a different row and the list re-renders),
  // cancel it so it never fires on a dead component.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <li className="flex flex-row gap-1.5">
      <button
        type="button"
        className={active ? "bg-gray-200 font-medium" : ""}
        aria-current={active ? "page" : undefined}
        onClick={() => dispatch(setActivePage(id))}
      >
        {title}
      </button>
      <button
        type="button"
        className="ml-1"
        onClick={handleDeleteClick}
        aria-label={confirming ? "Confirm delete page" : "Delete Page"}
      >
        {confirming ? "Confirm" : "🗑️"}
      </button>
    </li>
  );
}
