import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui";
import { assetsApi } from "@/features/assets/api";
import { AssetStatusBadge } from "@/features/assets/badges";

const AssetCombobox = ({ value, onChange, placeholder = "Search by asset tag or name...", initialResults = [], openOnMount = false }) => {
  const [query, setQuery] = useState(value ? `${value.assetTag} - ${value.name}` : "");
  const [results, setResults] = useState(initialResults || []);
  const [open, setOpen] = useState(openOnMount || false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // keep any preloaded results available but hide the dropdown
      return undefined;
    }

    const timeout = setTimeout(() => {
      if (query.trim()) {
        assetsApi.list({ search: query, limit: 8 }).then((res) => setResults(res.payload.data));
      } else {
        // when opened with no search query, load a small default asset list
        // if initialResults were provided, prefer them
        if (initialResults && initialResults.length) setResults(initialResults);
        else assetsApi.list({ limit: 12 }).then((res) => setResults(res.payload.data));
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, open, initialResults]);

  // keep results synced if parent provides new initial results
  useEffect(() => {
    if (initialResults && initialResults.length) setResults(initialResults);
  }, [initialResults]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = (asset) => {
    onChange(asset);
    setQuery(`${asset.assetTag} - ${asset.name}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          style={{ paddingLeft: "2.5rem" }}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-xl">
          {results.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => select(asset)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
            >
              <span>
                <span className="font-medium">{asset.assetTag}</span> &middot; {asset.name}
              </span>
              <AssetStatusBadge status={asset.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetCombobox;
