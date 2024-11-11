import { createStore } from "./utils";

const initialStates = {
  isModalOpen: false,
  registerId: '',
}

const storeExports = createStore(initialStates);

export const {
  useStore,
  useIsModalOpen,
  useSetIsModalOpen,
  useRegisterId,
  useSetRegisterId,
  useReset,
} = storeExports;