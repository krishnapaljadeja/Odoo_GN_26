import React, { useState } from "react";
import { useHistory } from "react-router";
import axios from "axios";
import { useDispatch } from "react-redux";
import { signin } from "../../state/authSlice";

import "./index.scss";

const Signup = () => {
  let history = useHistory();

  const dispatch = useDispatch();

  const defaultLocalState = {
    loginId: "",
    password: "",
    firstName: "",
    lastName: "",
    otp: "",
  };

  const [localState, setLocalState] = useState(defaultLocalState);
  const [otpRequested, setOtpRequested] = useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    setLocalState({ ...localState, [e.target.name]: e.target.value });
  };

  const onClickRequestOtp = async (e) => {
    try {
      e.preventDefault();

      if (localState.loginId === "" || localState.password === "" || localState.firstName === "") {
        window.alert("Login id, password or first name cannot be blank");
        return;
      }

      const res = await axios.post("/api/user/signup/request-otp", {
        login_id: localState.loginId,
        password: localState.password,
        first_name: localState.firstName,
        last_name: localState.lastName,
      });

      if (res.status === 200) {
        setOtpRequested(true);
        window.alert("OTP sent. In development without SMTP credentials, check the server console.");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        window.alert(error.response.data.message);
      }
    }
  };

  const onClickVerifyOtp = async (e) => {
    try {
      e.preventDefault();

      if (localState.loginId === "" || localState.otp === "") {
        window.alert("Login id and OTP cannot be blank");
        return;
      }

      const res = await axios.post("/api/user/signup/verify-otp", {
        login_id: localState.loginId,
        otp: localState.otp,
      });

      if (res.status === 200) {
        const { expires, user } = res.data.payload;
        dispatch(signin({ expires, user }));
        setLocalState(defaultLocalState);
        setOtpRequested(false);
        history.replace({
          pathname: import.meta.env.VITE_DEFAULT_LOGIN_REDIRECT,
        });
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        window.alert(error.response.data.message);
      }
    }
  };

  return (
    <div className="Signup">
      <div className="inner container is-fluid">
        <h2>Sign Up</h2>
        <input
          type="text"
          placeholder="First Name"
          name="firstName"
          value={localState.firstName}
          onChange={handleChange}
          className="input"
        />
        <input
          type="text"
          placeholder="Last Name"
          name="lastName"
          value={localState.lastName}
          onChange={handleChange}
          className="input"
        />
        <input
          type="text"
          placeholder="Login Id"
          name="loginId"
          value={localState.loginId}
          onChange={handleChange}
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          value={localState.password}
          onChange={handleChange}
          className="input"
        />
        {otpRequested && (
          <input
            type="text"
            placeholder="OTP"
            name="otp"
            value={localState.otp}
            onChange={handleChange}
            className="input"
          />
        )}
        <button onClick={otpRequested ? onClickVerifyOtp : onClickRequestOtp} className="button">
          {otpRequested ? "Verify OTP" : "Send OTP"}
        </button>
      </div>
    </div>
  );
};

export default Signup;