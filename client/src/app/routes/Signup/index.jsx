import React from "react";
import { useHistory, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { authApi } from "@/features/auth/api";
import { signupSchema } from "@/features/auth/schemas";
import { getApiMessage } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../../components/ui";
import { Reveal } from "../../components/animation";

const Signup = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", username: "", name: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    try {
      const data = await authApi.signup(values);
      dispatch(signin(data.payload));
      toast.success("Account created.");
      history.replace({ pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard" });
    } catch (error) {
      toast.error(getApiMessage(error, "Could not create account. Please try again."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <Reveal>
        <Card as="form" className="w-full max-w-md" onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">AssetFlow &ndash; create account</CardTitle>
            <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold tracking-wide text-zinc-200">
              AF
            </div>
          </CardHeader>
          <CardContent>
            <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-center text-xs leading-relaxed text-zinc-400">
              Sign up creates an employee account &mdash; admin roles assigned later
            </p>

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

            <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="username">
              <span>Username</span>
              <Input
                id="username"
                type="text"
                placeholder="jane_doe"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...register("username")}
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
                {...register("name")}
              />
              {errors.name && <span className="text-xs font-medium text-red-400">{errors.name.message}</span>}
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="password">
              <span>Password</span>
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
              <span>Confirm password</span>
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
              Create Account
            </Button>

            <p className="text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
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
