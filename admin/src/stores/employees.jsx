import { createStore } from "./utils";

export const limits = [50, 100, 500, 1000, 2000, 5000, 10000]

export const initialFormFilters = {
  isAvailable: 'all',
  hasDeviceId: 'all',
}

const initialStates = {
  limit: limits[0],
  search: '',
  isModalOpen: false,
  formFilters: initialFormFilters,
}

const storeExports = createStore(initialStates);

export const {
  useStore,
  useLimit,
  useSetLimit,
  useSearch,
  useSetSearch,
  useIsModalOpen,
  useSetIsModalOpen,
  useFormFilters,
  useSetFormFilters,
  useReset: useResetFormFilters,
} = storeExports;