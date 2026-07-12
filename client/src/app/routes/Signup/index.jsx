import React, { useEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { authApi } from "@/features/auth/api";
import { signupSchema, verifySignupSchema } from "@/features/auth/schemas";
import { getApiMessage } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../../components/ui";
import { Reveal } from "../../components/animation";
import { AssetFlowLogo } from "../../components/brand";

const Signup = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [pendingEmail, setPendingEmail] = useState("");

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", username: "", name: "", password: "", confirmPassword: "" },
  });

  const verifyForm = useForm({
    resolver: zodResolver(verifySignupSchema),
    defaultValues: { email: "", otp: "" },
  });

  useEffect(() => {
    if (pendingEmail) verifyForm.reset({ email: pendingEmail, otp: "" });
  }, [pendingEmail, verifyForm]);

  const onSubmit = async (values) => {
    try {
      await authApi.signup(values);
      setPendingEmail(values.email);
      toast.success("Verification code sent. Check your email.");
    } catch (error) {
      toast.error(getApiMessage(error, "Could not send verification code."));
    }
  };

  const onVerify = async (values) => {
    try {
      const data = await authApi.verifySignup(values);
      dispatch(signin(data.payload));
      toast.success("Account verified and created.");
      history.replace({ pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard" });
    } catch (error) {
      toast.error(getApiMessage(error, "Could not verify account."));
    }
  };

  const errors = signupForm.formState.errors;
  const otpErrors = verifyForm.formState.errors;

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <Reveal>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AssetFlowLogo as="div" className="auth-brand mx-auto mb-4" />
            <CardTitle className="text-xl">
              {pendingEmail ? "Verify email" : "Create account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingEmail ? (
              <form className="grid gap-4" onSubmit={signupForm.handleSubmit(onSubmit)} noValidate>
                <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-center text-xs leading-relaxed text-zinc-400">
                  Sign up creates an employee account after email verification - admin roles assigned later
                </p>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="email">
                  <span>Email</span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    {...signupForm.register("email")}
                  />
                  {errors.email && <span className="text-xs font-medium text-red-400">{errors.email.message}</span>}
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="username">
                  <span>Username</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="jane_doe"
                    autoComplete="username"
                    aria-invalid={Boolean(errors.username)}
                    {...signupForm.register("username")}
                  />
                  {errors.username && <span className="text-xs font-medium text-red-400">{errors.username.message}</span>}
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="name">
                  <span>Full name</span>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    {...signupForm.register("name")}
                  />
                  {errors.name && <span className="text-xs font-medium text-red-400">{errors.name.message}</span>}
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="password">
                  <span>Password</span>
                  <Input
                    id="password"
                    type="password"
                    placeholder="**********"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    {...signupForm.register("password")}
                  />
                  {errors.password && <span className="text-xs font-medium text-red-400">{errors.password.message}</span>}
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="confirmPassword">
                  <span>Confirm password</span>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="**********"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    {...signupForm.register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <span className="text-xs font-medium text-red-400">{errors.confirmPassword.message}</span>
                  )}
                </label>

                <Button type="submit" isLoading={signupForm.formState.isSubmitting} className="w-full">
                  Send verification code
                </Button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={verifyForm.handleSubmit(onVerify)} noValidate>
                <input type="hidden" {...verifyForm.register("email")} />
                <p className="rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-center text-xs leading-relaxed text-emerald-300">
                  Enter the 6-digit code sent to {pendingEmail}. Your account is created only after verification.
                </p>

                <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="otp">
                  <span>Verification code</span>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    aria-invalid={Boolean(otpErrors.otp)}
                    {...verifyForm.register("otp")}
                  />
                  {otpErrors.otp && <span className="text-xs font-medium text-red-400">{otpErrors.otp.message}</span>}
                </label>

                <Button type="submit" isLoading={verifyForm.formState.isSubmitting} className="w-full">
                  Verify & create account
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPendingEmail("")} className="w-full">
                  Use a different email
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-amber-400 hover:text-amber-300">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
};

export default Signup;
