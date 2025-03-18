
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NostrLogin } from "@/components/NostrLogin";

interface NostrLoginButtonProps {
  onLoginComplete?: () => void;
}

export const NostrLoginButton = ({ onLoginComplete }: NostrLoginButtonProps) => {
  return <NostrLogin onLoginComplete={onLoginComplete} />;
};
