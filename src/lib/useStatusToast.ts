import { useEffect } from "react";
import { toast } from "sonner"; 

type Status = "success" | "danger" | "warning" | "info" | null;

interface UseStatusToastProps {
  status: string;
  message?: string;
}

export function useStatusToast({ status, message }: UseStatusToastProps) {
  useEffect(() => {
    if (!status || !message) return;

    if (status === "success") { toast.success(message) };
    if (status === "danger") { toast.error(message)} ;
    if (status === "warning") toast.warning(message);
    if (status === "info") toast.info(message);
    else 
      toast.warning;

  }, [status, message]);
}
