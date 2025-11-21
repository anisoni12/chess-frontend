import React from "react";

type ButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export const Button = ({ onClick, children, className }: ButtonProps) => (
  <button
    onClick={onClick}
    className={className ?? "px-8 py-4 text-2xl bg-green-500 hover:bg-green-700 text-white font-bold rounded"}
  >
    {children}
  </button>
);