import React, { useState } from "react";
import { useHistory, useLocation } from "react-router";
import axios from "axios";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../../components/ui";

import "./index.scss";

const Signin = () => {
  let history = useHistory();
  let location = useLocation();
  let { from } = location.state || {
    from: { pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard" },
  };

  const dispatch = useDispatch();

  const defaultLocalState = {
    email: "",
    password: "",
  };

  const [localState, setLocalState] = useState(defaultLocalState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    setLocalState({ ...localState, [e.target.name]: e.target.value });
  };

  const onClickSignin = async (e) => {
    try {
      e.preventDefault();

      if (localState.email === "" || localState.password === "") {
        toast.error("Email and password are required.");
        return;
      }
      setIsSubmitting(true);
      const res = await axios.post("/auth/login", {
        email: localState.email,
        password: localState.password,
      });

      setLocalState(defaultLocalState);

      if (res.status === 200) {
        const { expires, user } = res.data.payload;
        dispatch(signin({ expires, user }));
        toast.success("Signed in.");
        history.replace(from);
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Could not sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="Signin">
      <Card as="form" className="auth-card" onSubmit={onClickSignin}>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use the email and password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="Email"
            name="email"
            value={localState.email}
            onChange={handleChange}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            name="password"
            value={localState.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" isLoading={isSubmitting}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signin;
