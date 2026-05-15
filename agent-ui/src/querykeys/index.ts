export const propertiesKeys = {
  all: ['properties'] as const,
  list: (params: object) => ['properties', 'list', params] as const,
  detail: (id: string) => ['properties', 'detail', id] as const,
};

export const leadsKeys = {
  all: ['leads'] as const,
  list: (params: object) => ['leads', 'list', params] as const,
  pipeline: () => ['leads', 'pipeline'] as const,
  detail: (id: string) => ['leads', 'detail', id] as const,
};

export const clientsKeys = {
  all: ['clients'] as const,
  list: (params: object) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};
