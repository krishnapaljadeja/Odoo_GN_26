let items = [
  {
    id: 1,
    name: "Example item",
    createdAt: new Date().toISOString(),
  },
];

const list = async () => items;

const create = async (data) => {
  const item = {
    id: Date.now(),
    name: data.name,
    createdAt: new Date().toISOString(),
  };

  items = [item, ...items];

  return item;
};

module.exports = {
  list,
  create,
};
