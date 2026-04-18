type PolicyNoticeProps = {
  className?: string;
};

export function PolicyNotice({ className }: PolicyNoticeProps) {
  return (
    <div
      className={
        className ??
        "rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      }
      role="note"
      aria-label="Booking policy notice"
    >
      <p className="font-semibold">Booking Policy</p>
      <p className="mt-1">
        All booking payments are non-refundable. Room reservations are handled
        on a first-come, first-served basis and are only guaranteed after
        successful payment confirmation.
      </p>
    </div>
  );
}
