"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CircleAlert,
  ClipboardCheck,
  FileSignature,
  Loader2,
} from "lucide-react";

import { contractApi } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type ContractAction = "sign" | "complete";

function errorMessage(error: unknown) {
  return error instanceof ApiFail
    ? error.response.error.message
    : "Unable to update the contract. Please try again.";
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export function ContractLifecyclePanel({
  proposalId,
  role,
}: {
  proposalId: number;
  role: "CLIENT" | "FREELANCER";
}) {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<ContractAction | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<ContractAction | null>(
    null,
  );
  const contractsQuery = useQuery({
    queryKey: ["contracts", role, proposalId],
    queryFn: async () => (await contractApi.forProposal(proposalId)).data.data,
  });
  const contract = contractsQuery.data?.find(
    (item) => item.proposalId === proposalId,
  );

  const runAction = async (action: ContractAction) => {
    if (!contract) return;
    setPendingAction(action);
    try {
      if (action === "sign") {
        await contractApi.sign(contract.id);
        toastSuccess({ message: "Contract signed." });
      } else {
        await contractApi.complete(contract.id);
        toastSuccess({ message: "Contract completed. Reviews are now open." });
      }
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setConfirmAction(null);
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  };

  if (contractsQuery.isLoading) {
    return (
      <section aria-label="Loading contract" className="rounded-xl border p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-16 w-full" />
        <Skeleton className="mt-4 h-9 w-32" />
      </section>
    );
  }

  if (contractsQuery.isError) {
    return (
      <section className="rounded-xl border border-destructive/40 p-5">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 text-destructive" />
          <div>
            <h2 className="font-semibold">Contract unavailable</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We could not load the contract for this proposal.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void contractsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!contract) {
    return (
      <section className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 text-amber-500" />
          <div>
            <h2 className="font-semibold">Contract not created</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This accepted proposal does not have a contract yet. Contact
              support to restore the contract before continuing.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const hasSigned =
    role === "CLIENT" ? contract.signedByClient : contract.signedByFreelancer;
  const canSign = contract.status === "PENDING_SIGN" && !hasSigned;
  const canComplete = role === "CLIENT" && contract.status === "ACTIVE";
  const isCompleted = contract.status === "COMPLETED";

  return (
    <>
      <section className="rounded-xl border border-[#4fae2e]/25 bg-[#4fae2e]/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#4fae2e]/15 p-2 text-[#4fae2e]">
              <FileSignature className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Contract #{contract.id}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isCompleted
                  ? "Work is complete. Both participants can leave a review."
                  : "Both participants must sign before work can begin."}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{statusLabel(contract.status)}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Contract value</p>
            <p className="mt-1 font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(contract.totalAmount)}
            </p>
          </div>
          <SignatureState
            label="Client signature"
            signed={contract.signedByClient}
          />
          <SignatureState
            label="Freelancer signature"
            signed={contract.signedByFreelancer}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {canSign ? (
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928] active:translate-y-px"
              onClick={() => setConfirmAction("sign")}
            >
              <FileSignature className="size-4" />
              Sign contract
            </Button>
          ) : null}
          {contract.status === "PENDING_SIGN" && hasSigned ? (
            <p className="self-center text-sm text-muted-foreground">
              Your signature is complete. Waiting for the other participant.
            </p>
          ) : null}
          {canComplete ? (
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928] active:translate-y-px"
              onClick={() => setConfirmAction("complete")}
            >
              <ClipboardCheck className="size-4" />
              Complete contract
            </Button>
          ) : null}
          {contract.status === "ACTIVE" && role === "FREELANCER" ? (
            <p className="self-center text-sm text-muted-foreground">
              Work is active. The client will confirm when it is complete.
            </p>
          ) : null}
          {isCompleted ? (
            <Button
              asChild
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
            >
              <Link
                href={`/account-profile?tab=reviews&contractId=${contract.id}`}
              >
                Write review
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "sign"
                ? "Sign this contract?"
                : "Mark this contract complete?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "sign"
                ? "Your signature confirms that you agree to this contract."
                : "This closes the work and allows both participants to submit reviews."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingAction !== null}
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              onClick={(event) => {
                event.preventDefault();
                if (confirmAction) void runAction(confirmAction);
              }}
            >
              {pendingAction ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {confirmAction === "sign"
                ? "Confirm signature"
                : "Confirm completion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SignatureState({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        {signed ? <Check className="size-4 text-[#4fae2e]" /> : null}
        {signed ? "Signed" : "Waiting"}
      </p>
    </div>
  );
}
