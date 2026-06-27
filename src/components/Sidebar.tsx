import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createPage, selectPageIds } from "../store/pageSlice";
import PageListItem from "./PageListItem";

export default function Sidebar() {
  const pageIds = useAppSelector(selectPageIds, shallowEqual);
  const dispatch = useAppDispatch();
  return (
    <>
      <ul>
        {pageIds.map((id) => (
          <PageListItem key={id} id={id} />
        ))}
      </ul>
      <button type="button" onClick={() => dispatch(createPage())}>
        + New Page
      </button>
    </>
  );
}
