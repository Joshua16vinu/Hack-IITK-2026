import { UploadZone } from "@/features/upload/UploadZone";

interface HomeUploadPanelProps {
  onSuccess: (data: unknown) => void;
}

export function HomeUploadPanel({ onSuccess }: HomeUploadPanelProps) {
  return (
    <div className="w-full xl:pl-12 flex justify-center xl:justify-end z-10">
      <div className="w-full max-w-xl">
        <UploadZone onSuccess={onSuccess} />
      </div>
    </div>
  );
}
