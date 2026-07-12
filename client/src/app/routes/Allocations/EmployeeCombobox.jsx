import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui";
import { orgApi } from "@/features/org/api";

const EmployeeCombobox = ({ value, onChange, placeholder = "Select employee...", excludeUserId }) => {
  const [query, setQuery] = useState(value ? value.name || value.username : "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setResults([]);
      return undefined;
    }

    const timeout = setTimeout(() => {
      orgApi.listEmployees({ search: query, limit: 8, status: "ACTIVE" }).then((res) => {
        const rows = res.payload.data.filter((employee) => employee.id !== excludeUserId);
        setResults(rows);
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, open, excludeUserId]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = (employee) => {
    onChange(employee);
    setQuery(employee.name || employee.username);
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
          {results.map((employee) => (
            <button
              key={employee.id}
              type="button"
              onClick={() => select(employee)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
            >
              <span>{employee.name || employee.username}</span>
              <span className="text-xs text-zinc-500">{employee.department?.name || "No dept"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeCombobox;
