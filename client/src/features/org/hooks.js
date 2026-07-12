import { useCallback, useEffect, useState } from "react";
import { orgApi } from "./api";
import { getApiMessage } from "@/lib/api";

// Shared by every module that needs a department/category picker (Assets,
// Allocations, Bookings, ...) so they all read from the same live source per
// plan section 3 ("Editing a department here also drives the picklist
// elsewhere").
const useOrgList = (fetcher, params) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    fetcher({ limit: 100, ...(params || {}) })
      .then((res) => {
        if (mounted) setData(res.payload?.data || []);
      })
      .catch((err) => {
        if (mounted) setError(getApiMessage(err, "Could not load data"));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, isLoading, error, refetch };
};

export const useDepartments = (params) => useOrgList(orgApi.listDepartments, params);
export const useCategories = (params) => useOrgList(orgApi.listCategories, params);
export const useEmployees = (params) => useOrgList(orgApi.listEmployees, params);

export const activeOnly = (departments) => departments.filter((department) => department.status === "ACTIVE");
