import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../lib/api";

export function useOrderActions() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] });

  const advance = useMutation({
    mutationFn: api.orders.advance,
    onSuccess: (order) => {
      toast.success(`Order advanced to "${order.status}"`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const fail = useMutation({
    mutationFn: api.orders.fail,
    onSuccess: () => {
      toast.success("Order marked as failed");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return { advance, fail };
}
