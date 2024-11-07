import { SnackbarProps, SnackbarStore } from '@/types/snackbar';
import { create } from 'zustand';

// initial state
const initialState: SnackbarProps = {
  action: false,
  open: false,
  message: 'Note archived',
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right'
  },
  variant: 'default',
  alert: {
    variant: 'filled',
    sx: {}
  },
  transition: 'Fade',
  close: true,
  actionButton: false,
  maxStack: 3,
  dense: false,
  iconVariant: 'usedefault'
};

const useStore = create<SnackbarStore>((set) => ({
  ...initialState,
  setAction: (action) => set({ action }),
  setOpen: (open) => set({ open }),
  setMessage: (message) => set({ message }),
  setAnchorOrigin: (anchorOrigin) => set({ anchorOrigin }),
  setVariant: (variant) => set({ variant }),
  setAlert: (alert) => set({ alert }),
  setTransition: (transition) => set({ transition }),
  setClose: (close) => set({ close }),
  setActionButton: (actionButton) => set({ actionButton }),
  setDense: (dense) => set({ dense }),
  setMaxStack: (maxStack) => set({ maxStack }),
  setIconVariant: (iconVariant) => set({ iconVariant }),
  openSnackbar: (payload) =>
    set((state) => ({
      ...state,
      action: !state.action,
      open: payload.open || initialState.open,
      message: payload.message || initialState.message,
      anchorOrigin: payload.anchorOrigin || initialState.anchorOrigin,
      variant: payload.variant || initialState.variant,
      alert: {
        color: payload.alert?.color || initialState.alert.color,
        variant: payload.alert?.variant || initialState.alert.variant,
        sx: payload.alert?.sx || initialState.alert.sx
      },
      transition: payload.transition || initialState.transition,
      close: payload.close === false ? payload.close : initialState.close,
      actionButton: payload.actionButton || initialState.actionButton
    })),
  closeSnackbar: () => set({ open: false }),
  handlerIncrease: (payload) =>
    set((state) => ({
      ...state,
      maxStack: payload.maxStack
    })),
  handlerDense: (payload) =>
    set((state) => ({
      ...state,
      dense: payload.dense
    })),
  handlerIconVariants: (payload) =>
    set((state) => ({
      ...state,
      iconVariant: payload.iconVariant
    }))
}));

export const useSnackbarStore = () => {
  const action = useStore((state) => state.action);
  const open = useStore((state) => state.open);
  const message = useStore((state) => state.message);
  const anchorOrigin = useStore((state) => state.anchorOrigin);
  const variant = useStore((state) => state.variant);
  const alert = useStore((state) => state.alert);
  const transition = useStore((state) => state.transition);
  const close = useStore((state) => state.close);
  const actionButton = useStore((state) => state.actionButton);
  const dense = useStore((state) => state.dense);
  const maxStack = useStore((state) => state.maxStack);
  const iconVariant = useStore((state) => state.iconVariant);
  return { action, open, message, anchorOrigin, variant, alert, transition, close, actionButton, dense, maxStack, iconVariant };
};

export const useSnackbarStoreActions = () => {
  const setAction = useStore((state) => state.setAction);
  const setOpen = useStore((state) => state.setOpen);
  const setMessage = useStore((state) => state.setMessage);
  const setAnchorOrigin = useStore((state) => state.setAnchorOrigin);
  const setVariant = useStore((state) => state.setVariant);
  const setAlert = useStore((state) => state.setAlert);
  const setTransition = useStore((state) => state.setTransition);
  const setClose = useStore((state) => state.setClose);
  const setActionButton = useStore((state) => state.setActionButton);
  const setDense = useStore((state) => state.setDense);
  const setMaxStack = useStore((state) => state.setMaxStack);
  const setIconVariant = useStore((state) => state.setIconVariant);
  const openSnackbar = useStore((state) => state.openSnackbar);
  const closeSnackbar = useStore((state) => state.closeSnackbar);
  const handlerIncrease = useStore((state) => state.handlerIncrease);
  const handlerDense = useStore((state) => state.handlerDense);
  const handlerIconVariants = useStore((state) => state.handlerIconVariants);

  return {
    setAction,
    setOpen,
    setMessage,
    setAnchorOrigin,
    setVariant,
    setAlert,
    setTransition,
    setClose,
    setActionButton,
    setDense,
    setMaxStack,
    setIconVariant,
    openSnackbar,
    closeSnackbar,
    handlerIncrease,
    handlerDense,
    handlerIconVariants
  };
};
