import React from "react";
import { useHistory, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { authApi } from "@/features/auth/api";
import { loginSchema } from "@/features/auth/schemas";
import { getApiMessage } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../../components/ui";
import { Reveal } from "../../components/animation";

const Login = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();

  const { from } = location.state || {
    from: { pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard" },
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      const data = await authApi.login(values);
      dispatch(signin(data.payload));
      toast.success("Signed in.");
      history.replace(from);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not sign in. Please try again."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <Reveal>
        <Card as="form" className="w-full max-w-md" onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">AssetFlow &ndash; login</CardTitle>
            <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold tracking-wide text-zinc-200">
              AF
            </div>
          </CardHeader>
          <CardContent>
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

            <label className="grid gap-2 text-sm font-medium text-zinc-300" htmlFor="password">
              <span>Password</span>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && <span className="text-xs font-medium text-red-400">{errors.password.message}</span>}
            </label>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Sign In
            </Button>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                Forgot password
              </Link>
            </div>

            <div className="my-2 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">New here?</span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>

            <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-center text-xs leading-relaxed text-zinc-400">
              Sign up creates an employee account &mdash; admin roles assigned later
            </p>

            <Link to="/signup">
              <Button type="button" variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
};

export default Login;
