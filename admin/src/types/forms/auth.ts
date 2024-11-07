import { WithRecaptcha } from "./form";

export interface SignupForm extends LoginForm {
  email: string;
  tin: string;
  vin: string;
  name: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  confirmPassword: string;
}

export type SignupFormMutation = SignupForm & WithRecaptcha;


export interface LoginForm {
  username: string;
  password: string;
}

export type LoginFormMutation = {
  recaptcha: string | null;
} & LoginForm;

export interface ForgotPasswordForm {
  email: string;
}

export type ForgotPasswordFormMutation = ForgotPasswordForm & WithRecaptcha;

export interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export type ResetPasswordFormMutation = ResetPasswordForm & WithRecaptcha;
