import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { authApi } from "@/features/auth/api";
import { forgotPasswordSchema, resetPasswordSchema } from "@/features/auth/schemas";
import { getApiMessage } from "@/lib/api";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "../../components/ui";
import { Reveal } from "../../components/animation";

const RequestCodeStep = ({ onSent }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      toast.success("If that email is registered, a verification code has been sent.");
      onSent(values.email);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not send verification code."));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="email">
        <span>Email</span>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <span className="text-xs font-medium text-red-400">{errors.email.message}</span>}
      </label>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Send verification code
      </Button>
    </form>
  );
};

const ResetPasswordStep = ({ email, onReset }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    try {
      const data = await authApi.resetPassword(values);
      onReset(data.payload);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not reset password."));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register("email")} />

      <p className="text-sm text-zinc-400">
        Enter the 6-digit code sent to <span className="font-medium text-zinc-200">{email}</span>.
      </p>

      <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="otp">
        <span>Verification code</span>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          maxLength={6}
          aria-invalid={Boolean(errors.otp)}
          {...register("otp")}
        />
        {errors.otp && <span className="text-xs font-medium text-red-400">{errors.otp.message}</span>}
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="password">
        <span>New password</span>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && <span className="text-xs font-medium text-red-400">{errors.password.message}</span>}
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="confirmPassword">
        <span>Confirm new password</span>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <span className="text-xs font-medium text-red-400">{errors.confirmPassword.message}</span>
        )}
      </label>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Reset password
      </Button>
    </form>
  );
};

const ForgotPassword = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");

  const handleReset = (payload) => {
    dispatch(signin(payload));
    toast.success("Password reset. You're signed in.");
    history.replace(import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <Reveal>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>
              {step === "request"
                ? "We'll email you a verification code."
                : "Enter the code and choose a new password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" ? (
              <RequestCodeStep
                onSent={(sentEmail) => {
                  setEmail(sentEmail);
                  setStep("reset");
                }}
              />
            ) : (
              <ResetPasswordStep email={email} onReset={handleReset} />
            )}

            <p className="mt-2 text-center text-sm text-zinc-400">
              <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
};

export default ForgotPassword;
