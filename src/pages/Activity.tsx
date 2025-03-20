
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Activity() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/activity", { replace: true });
  }, [navigate]);

  return null;
}
