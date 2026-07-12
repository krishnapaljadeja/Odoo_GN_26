import React from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { signout } from "../../state/authSlice";
import { Button } from "../../components/ui";

const Signout = (props) => {
  const dispatch = useDispatch();

  const onClickSignout = async (e) => {
    try {
      e.preventDefault();

      const res = await axios.delete("/auth/logout");

      if (res.status === 200) {
        dispatch(signout());
        toast.success("Signed out.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not sign out.");
    }
  };
  return (
    <Button variant="outline" onClick={onClickSignout} {...props}>
      Sign Out
    </Button>
  );
};

export default Signout;
