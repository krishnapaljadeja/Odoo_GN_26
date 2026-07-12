import React from "react";
import { Loader } from "../ui";

const DataState = ({ isLoading, error, isEmpty, empty, children }) => {
  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
        <Loader label="Loading data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (isEmpty) {
    return empty || null;
  }

  return children;
};

export default DataState;
