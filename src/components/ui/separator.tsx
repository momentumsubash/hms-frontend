import * as React from "react";

export function Separator({ className = "", ...props }: React.ComponentProps<"hr">) {
  return (
    <hr
      className={
        "border-t border-gray-200 my-4 w-full " + className
      }
      {...props}
    />
  );
}
