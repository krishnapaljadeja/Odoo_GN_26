// Shared parsing for the list-endpoint conventions in plan section 5:
// ?search=&sortBy=&sortOrder=asc|desc&page=&limit= -> { data, total, page, limit }
const parseListQuery = (query, { defaultSortBy = "id", allowedSortBy = [] } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const search = (query.search || "").trim();

  let sortBy = query.sortBy || defaultSortBy;
  if (allowedSortBy.length > 0 && !allowedSortBy.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    search,
    sortBy,
    sortOrder,
  };
};

const toListResponse = (data, total, { page, limit }) => ({ data, total, page, limit });

module.exports = { parseListQuery, toListResponse };
