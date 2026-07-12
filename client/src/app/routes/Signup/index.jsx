import React, { useState } from "react";
import { useHistory } from "react-router";
import axios from "axios";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { signin } from "../../state/authSlice";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../../components/ui";

import "./index.scss";

const Signup = () => {
  let history = useHistory();

  const dispatch = useDispatch();

  const defaultLocalState = {
    email: "",
    username: "",
    password: "",
  };

  const [localState, setLocalState] = useState(defaultLocalState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    setLocalState({ ...localState, [e.target.name]: e.target.value });
  };

  const onClickSignup = async (e) => {
    try {
      e.preventDefault();

      if (localState.email === "" || localState.username === "" || localState.password === "") {
        toast.error("Email, username and password are required.");
        return;
      }

      setIsSubmitting(true);
      const res = await axios.post("/auth/signup", {
        email: localState.email,
        username: localState.username,
        password: localState.password,
      });

      if (res.status === 201 || res.status === 200) {
        const { expires, user } = res.data.payload;
        dispatch(signin({ expires, user }));
        setLocalState(defaultLocalState);
        toast.success("Account created.");
        history.replace({
          pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT || "/dashboard",
        });
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Could not create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="Signup">
      <Card as="form" className="auth-card" onSubmit={onClickSignup}>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your account with an auto-generated user ID.</CardDescription>
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
            type="text"
            placeholder="Username"
            name="username"
            value={localState.username}
            onChange={handleChange}
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Password"
            name="password"
            value={localState.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" isLoading={isSubmitting}>
            Create Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
