
import React from "react";

interface RelaySettingsPanelProps {
  visible: boolean;
}

export const RelaySettingsPanel: React.FC<RelaySettingsPanelProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="p-4 border rounded-lg bg-background">
        <h3 className="text-lg font-medium mb-2">Relay Settings</h3>
        <p className="text-muted-foreground">Configure your Nostr relays here.</p>
      </div>
    </div>
  );
};
