import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";

export default function Loading() {
  return <SessionLoadingOverlay title="Opening super admin" message="Preparing the operator dashboard." tone="admin" />;
}
