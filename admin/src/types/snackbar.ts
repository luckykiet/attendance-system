import { AlertProps, SnackbarOrigin } from '@mui/material';

export type SnackbarActionProps = {
  payload?: SnackbarProps;
};

export interface SnackbarProps {
  action?: boolean;
  open: boolean;
  message: string;
  anchorOrigin?: SnackbarOrigin;
  variant: string;
  alert: AlertProps;
  transition: string;
  close?: boolean;
  actionButton?: boolean;
  dense?: boolean;
  maxStack?: number;
  iconVariant?: string;
}

export type SnackbarStore = {
  setAction: (action: boolean) => void;
  setOpen: (open: boolean) => void;
  setMessage: (message: string) => void;
  setAnchorOrigin: (anchorOrigin: SnackbarOrigin) => void;
  setVariant: (variant: string) => void;
  setAlert: (alert: AlertProps) => void;
  setTransition: (transition: string) => void;
  setClose: (close: boolean) => void;
  setActionButton: (actionButton: boolean) => void;
  setDense: (dense: boolean) => void;
  setMaxStack: (maxStack: number) => void;
  setIconVariant: (iconVariant: string) => void;
  openSnackbar: (payload: SnackbarProps) => void;
  closeSnackbar: () => void;
  handlerIncrease: (payload: { maxStack: number }) => void;
  handlerDense: (payload: { dense: boolean }) => void;
  handlerIconVariants: (payload: { iconVariant: string }) => void;
} & SnackbarProps;
