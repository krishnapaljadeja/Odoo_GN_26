import React from "react";
import { Loader } from "../ui";

const DataState = ({ isLoading, error, isEmpty, empty, children }) => {
  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader label="Loading data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
