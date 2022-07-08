import React from "react";
import useTimeout from "./useTimeout";

export default function useDebounce(
  callback: React.EffectCallback,
  delay: number,
  dependencies: React.DependencyList
) {
  const { clear, restart } = useTimeout(callback, delay);
  React.useEffect(restart, [...dependencies, restart]);
  React.useEffect(clear, [clear]);
}
