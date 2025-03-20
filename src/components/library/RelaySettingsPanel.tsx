
import React from "react";
import { RelaySettings } from "@/components/RelaySettings";

interface RelaySettingsPanelProps {
  visible: boolean;
}

export const RelaySettingsPanel: React.FC<RelaySettingsPanelProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-5 duration-300">
      <RelaySettings />
    </div>
  );
};
