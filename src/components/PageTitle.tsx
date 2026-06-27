import { useAppDispatch, useAppSelector } from "../store/hooks";
import { renamePage } from "../store/pageSlice";
export default function PageTitle() {
  const dispatch = useAppDispatch();
  const activePageId = useAppSelector((s) => s.pages.activePageId);

  const title = useAppSelector(
    (s) => s.pages.list.find((p) => p.id === activePageId)?.title ?? "",
  );

  if (activePageId === null) return null;

  return (
    <input
      type="text"
      value={title}
      placeholder="Untitled"
      onChange={(e) =>
        dispatch(renamePage({ id: activePageId, title: e.target.value }))
      }
      className="text-4xl font-bold text-gray-900 outline-none w-full bg-transparent"
    />
  );
}
