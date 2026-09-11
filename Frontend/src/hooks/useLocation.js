import { useContext } from "react";
import { LocationContext } from "../context/LocationContext";

export const useLocation = () => useContext(LocationContext);
export const useUserLocation = () => useContext(LocationContext);
