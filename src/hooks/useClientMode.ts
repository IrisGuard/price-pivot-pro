import { useState } from 'react';

export const useClientMode = () => {
  const [isClientMode, setIsClientMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const toggleClientMode = () => {
    setIsClientMode(!isClientMode);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const enterClientMode = () => {
    setIsClientMode(true);
    setShowControls(false);
  };

  const enterAdminMode = () => {
    setIsClientMode(false);
    setShowControls(true);
  };

  return {
    isClientMode,
    showControls,
    toggleClientMode,
    toggleControls,
    enterClientMode,
    enterAdminMode
  };
};