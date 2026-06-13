import { useEffect, useRef } from "react";
import { filterCommands } from "../services/SlashParser";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectActivePageBlocks } from "../store/pageSlice";
import {
  closeSlashMenu,
  requestSlashConfirm,
  setSlashSelectedIndex,
} from "../store/uiSlice";

export default function SlashMenu() {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector((state) => state.ui.slashMenuOpen);
  const position = useAppSelector((state) => state.ui.slashMenuPosition);
  const selectedIndex = useAppSelector((state) => state.ui.slashSelectedIndex);
  const blockId = useAppSelector((state) => state.ui.slashMenuBlockId);
  const startIndex = useAppSelector((state) => state.ui.slashMenuStartIndex);

  const block = useAppSelector((state) => {
    const activePageBlocks = selectActivePageBlocks(state);
    return activePageBlocks.find((b) => b.id === blockId);
  });
  const query = block ? block.content.slice(startIndex + 1) : "";
  const commands = filterCommands(query);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch(closeSlashMenu());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, dispatch]);

  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      style={{ top: position.top + 4, left: position.left }}
      className="fixed z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
      aria-label="Block type commands"
      role="listbox"
    >
      {commands.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400">No results</p>
      ) : (
        <ul role="presentation" className="py-1">
          {commands.map((command, index) => (
            <li
              key={command.id}
              onMouseEnter={() => dispatch(setSlashSelectedIndex(index))}
              onClick={() => dispatch(requestSlashConfirm(command))}
              className={`flex flex-col px-3 py-2 cursor-pointer ${
                index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <span className="text-sm font-medium text-gray-900">
                {command.label}
              </span>
              <span className="text-xs text-gray-500">
                {command.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
